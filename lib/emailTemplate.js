export function buildEmailHtml(html, css) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        ${css}
      </style>
    </head>
    <body style="margin:0; padding:0; background:#f3f4f6;">
      
      <!-- Outer wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
        <tr>
          <td align="center">

            <!-- Inner container (600px) -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff;">
              <tr>
                <td>

                  ${html}

                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

    </body>
  </html>
  `;
}