export function getTemplate(name, data = {}) {
  switch (name) {
    case "newsletter":
      return {
        subject: "🎉 Subscription Confirmed",
        html: `
          <div style="font-family:sans-serif;padding:20px">
            <h2>Welcome ${data.name || "User"} 💚</h2>
            <p>Thanks for subscribing to Kayakalap.</p>
          </div>
        `,
      };

    case "admin":
      return {
        subject: "🚀 New Subscriber",
        html: `
          <h3>New Subscription</h3>
          <p>Email: ${data.email}</p>
        `,
      };

    default:
      return {
        subject: "Notification",
        html: "<p>No template found</p>",
      };
  }
}