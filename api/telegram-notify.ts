export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { chatId, studentName, status, points, maxPoints, topic, date } = body;

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "chatId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
    const notifyUrl = process.env.TELEGRAM_BOT_NOTIFY_URL;
    const notifySecret = process.env.TELEGRAM_NOTIFY_SECRET || "ilmoz_secret_notify_key";

    // Format status text
    let statusText = "Пришел(ла) вовремя ✅";
    if (status === "late") {
      statusText = "Опоздал(а) ⏰";
    } else if (status === "absent" || status === false || status === "false") {
      statusText = "Не пришел(ла) ❌";
    }

    // If external bot notification HTTP server is configured, forward to it
    if (notifyUrl) {
      const res = await fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Notify-Secret": notifySecret,
        },
        body: JSON.stringify({
          chat_id: chatId,
          student_name: studentName,
          status,
          points,
          max_points: maxPoints || 10,
          topic,
          date,
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Direct Telegram Bot API send fallback if TELEGRAM_BOT_TOKEN is present
    if (!botToken) {
      return new Response(
        JSON.stringify({
          error: "Neither TELEGRAM_BOT_TOKEN nor TELEGRAM_BOT_NOTIFY_URL is set in environment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const lines = [
      `🔔 <b>Уведомление от Ilmoz</b>\n`,
      `👤 <b>Ученик:</b> ${studentName || "Ученик"}`,
      `📌 <b>Статус:</b> ${statusText}`,
    ];

    if (topic) lines.append ? lines.push(`📖 <b>Урок:</b> ${topic}`) : lines.push(`📖 <b>Урок:</b> ${topic}`);
    if (date) lines.push(`📅 <b>Дата:</b> ${date}`);
    if (points !== undefined && points !== null && points !== "") {
      lines.push(`📊 <b>Оценка:</b> ${points} из ${maxPoints || 10} баллов`);
    }

    const text = lines.join("\n");

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const tgData = await tgRes.json();
    return new Response(JSON.stringify(tgData), {
      status: tgRes.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
