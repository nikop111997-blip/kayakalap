export function addClickTracking(html, campaignId, email) {
  return html.replace(/href="(.*?)"/g, (match, url) => {
    const trackedUrl = `https://kayakalap.vercel.app/api/email/click?cid=${campaignId}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`;
    return `href="${trackedUrl}"`;
  });
}