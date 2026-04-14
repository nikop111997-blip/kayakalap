export function getTemplate(name, data = {}) {
  // Reusable styling variables for consistency and clean code
  const styles = {
    wrapper: `background-color: #f7f7f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;`,
    container: `max-width: 600px; margin: 0 auto;`,
    logoWrapper: `padding-bottom: 20px; text-align: left;`,
    logo: `max-height: 40px;`,
    card: `background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 4px; padding: 40px; text-align: left;`,
    heroImage: `text-align: center; margin-bottom: 30px; font-size: 72px;`, // Using emoji as a placeholder for the hero graphic
    heading: `font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 20px; color: #111111;`,
    paragraph: `font-size: 15px; line-height: 1.6; color: #444444; margin-bottom: 20px;`,
    detailsBox: `background-color: #f9f9fb; border: 1px solid #eeeeee; padding: 20px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; color: #555555;`,
    detailRow: `margin-bottom: 10px; line-height: 1.5;`,
    strong: `color: #222222; font-weight: 600;`,
    signature: `font-size: 15px; line-height: 1.6; color: #444444; margin-top: 30px;`,
    footer: `padding-top: 30px; text-align: left; font-size: 12px; color: #999999; line-height: 1.5;`,
    footerLink: `color: #999999; text-decoration: underline; margin-right: 15px;`
  };

  const commonFooter = `
    <div style="${styles.footer}">
      <p style="margin: 0 0 10px 0;">This email was sent by Kayapalat Wellness.</p>
      <a href="https://kayapalatwellness.framer.website/legal/privacy-policy" style="${styles.footerLink}">Privacy Policy</a>
      <a href="https://kayapalatwellness.framer.website/legal/terms-of-service" style="${styles.footerLink}">Terms of Service</a>
    </div>
  `;

  const commonHeader = `
    <div style="${styles.logoWrapper}">
      <img src="https://kayakalap.vercel.app/_next/image?url=%2Flogo.avif&w=384&q=75" alt="Kayakalap Logo" style="${styles.logo}" />
    </div>
  `;

  switch (name) {
    case "newsletter":
      return {
        subject: "🎉 Thanks for subscribing!",
        html: `
          <div style="${styles.wrapper}">
            <div style="${styles.container}">
              ${commonHeader}
              <div style="${styles.card}">
                <div style="${styles.heroImage}">💌</div>
                <h2 style="${styles.heading}">Thanks for subscribing!</h2>
                
                <p style="${styles.paragraph}">
                  The Kayakalap newsletter is the best way to find out about our current wellness programs and exciting developments.
                </p>
                <p style="${styles.paragraph}">
                  Once or twice a month, you will receive a newsletter with information about major updates, special offers, great deals on our training programs, and much more.
                </p>
                <p style="${styles.paragraph}">
                  We're happy to have you on board, ${data.name || "there"}!
                </p>
                
                <div style="${styles.signature}">
                  Cheers,<br/>
                  <i style="color: #666;">The Kayakalap Team</i>
                </div>
              </div>
              ${commonFooter}
            </div>
          </div>
        `,
      };

    case "callback":
      return {
        subject: "We've received your query! Let's get started 🚀",
        html: `
          <div style="${styles.wrapper}">
            <div style="${styles.container}">
              ${commonHeader}
              <div style="${styles.card}">
                <h2 style="${styles.heading}">Thanks for reaching out!</h2>
                
                <p style="${styles.paragraph}">
                  Hi ${data.name || "there"},
                </p>
                <p style="${styles.paragraph}">
                  Thank you for contacting Kayakalap. We have successfully received your query. One of our expert coaches will review your details and give you a call back shortly to help you with your journey!
                </p>
                
                <div style="${styles.detailsBox}">
                  <h3 style="margin-top: 0; font-size: 16px; color: #333;">Your Details Summary:</h3>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Name:</span> ${data.name || "N/A"}</div>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Email:</span> ${data.email || "N/A"}</div>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Phone:</span> ${data.phone || "N/A"}</div>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Preferred Date:</span> ${data.bookingDate - data.bookingTime || "N/A"}</div>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Primary Goal:</span> ${data.goal || "N/A"}</div>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Program:</span> ${data.program || "N/A"}</div>
                  <div style="${styles.detailRow}"><span style="${styles.strong}">Message:</span> ${data.message || "N/A"}</div>
                </div>

                <p style="${styles.paragraph}">
                  If you have any immediate questions, feel free to reply directly to this email. 
                </p>
                
                <div style="${styles.signature}">
                  Stay healthy,<br/>
                  <i style="color: #666;">The Kayakalap Team</i>
                </div>
              </div>
              ${commonFooter}
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "Notification from Kayakalap",
        html: `
          <div style="${styles.wrapper}">
            <div style="${styles.container}">
              ${commonHeader}
              <div style="${styles.card}">
                <p style="${styles.paragraph}">No template found for the requested action.</p>
              </div>
              ${commonFooter}
            </div>
          </div>
        `,
      };
  }
}