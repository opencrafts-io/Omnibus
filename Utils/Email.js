export async function sendTicketPurchasedEmail(
    user_name = "Valued Guest",
    id,
    event_name,
    event_description,
    event_location,
    event_start_date,
    event_end_date,
    event_banner_image,
    created_at,
    ticket_name,
    ticket_for,
    ticket_quantity,
    ticket_price,
    ticket_start_date,
    ticket_end_date,
    qr_code_base64
) {

const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Set to false if you prefer 24-hour time (e.g., 00:00)
        timeZone: 'UTC' // Keep if your DB dates are stored in UTC
    });
};

    const currentYear = new Date().getFullYear();
    
    const formattedEventStart = formatDate(event_start_date);
    const formattedEventEnd = formatDate(event_end_date);
    const formattedTicketStart = formatDate(ticket_start_date);
    const formattedTicketEnd = formatDate(ticket_end_date);

    
    // Calculate total price accurately based on quantity
    const totalAmount = (Number(ticket_price) * Number(ticket_quantity)).toFixed(2);
    const unitPrice = Number(ticket_price).toFixed(2);

    const email = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Ticket Receipt</title>
    <style>
        @media screen and (max-width: 600px) {
            .wrapper-padding { padding: 20px 10px !important; }
            .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" class="wrapper-padding" style="padding: 40px 0;">
                
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden;">
                    
                    <!-- Top Accent Bar -->
                    <tr>
                        <td height="6" style="background-color: #4f46e5; line-height: 6px; font-size: 6px;">&nbsp;</td>
                    </tr>

                    ${event_banner_image ? `
                    <!-- Event Banner Image -->
                    <tr>
                        <td>
                            <img src="${event_banner_image}" alt="${event_name}" style="width: 100%; max-height: 200px; object-fit: cover; display: block;" />
                        </td>
                    </tr>
                    ` : ''}

                    <!-- Header & Personal Greeting -->
                    <tr>
                        <td class="content-padding" style="padding: 36px 40px 20px 40px;">
                          
                            
                            <div style="background-color: #ecfdf5; color: #059669; display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px;">
                                ✓ Payment Confirmed
                            </div>
                            
                            <h1 style="margin: 0 0 12px 0; color: #111827; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.3;">
                                Hello ${user_name},
                            </h1>
                            
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                We've received your payment! Your ticket for <strong style="color: #111827;">${event_name}</strong> is all set. You can find your receipt and digital pass below.
                            </p>

                            ${event_description ? `
                            <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.5; font-style: italic;">
                                ${event_description}
                            </p>
                            ` : ''}
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td class="content-padding" style="padding: 10px 40px 0 40px;">
                            
                            <!-- Event Details Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                                <tr>
                                    <td width="50%" style="vertical-align: top; padding-bottom: 12px;">
                                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Event Name</p>
                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #111827; font-weight: 600;">${event_name}</p>
                                    </td>
                                    <td width="50%" style="text-align: right; vertical-align: top; padding-bottom: 12px;">
                                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Ticket Purchase Date</p>
                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #111827; font-weight: 600;">${created_at}</p>
                                    </td>
                                </tr>
                                ${event_location ? `
                                <tr>
                                    <td colspan="2" style="border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Location</p>
                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #111827; font-weight: 600;"> ${event_location}</p>
                                    </td>
                                </tr>
                                ` : ''}
                                ${(formattedEventStart || formattedEventEnd) ? `
                                <tr>
                                    <td colspan="2" style="padding-top: 10px;">
                                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Event Date & Time</p>
                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #111827; font-weight: 600;">
                                             ${formattedEventStart || ''} ${formattedEventEnd ? `– ${formattedEventEnd}` : ''}
                                        </p>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>

                            <!-- Itemized Table -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th align="left" style="padding-bottom: 12px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Description</th>
                                        <th align="center" style="padding-bottom: 12px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Qty</th>
                                        <th align="right" style="padding-bottom: 12px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 16px 0; border-top: 1px solid #f1f5f9;">
                                            <div style="font-weight: 700; color: #111827; font-size: 15px;">${ticket_name}</div>
                                            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Admits ${ticket_for} person(s)</div>
                                            
                                            ${(formattedTicketStart || formattedTicketEnd) ? `
                                            <div style="font-size: 12px; color: #4f46e5; margin-top: 4px; font-weight: 500;">
                                                Valid: ${formattedTicketStart || ''} ${formattedTicketEnd ? `– ${formattedTicketEnd}` : ''}
                                            </div>
                                            ` : ''}
                                        </td>
                                        <td align="center" style="padding: 16px 0; border-top: 1px solid #f1f5f9; color: #111827; font-size: 14px;">${ticket_quantity}</td>
                                        <td align="right" style="padding: 16px 0; border-top: 1px solid #f1f5f9; font-weight: 700; color: #111827; font-size: 14px;">${unitPrice}</td>
                                    </tr>
                                    <!-- Totals -->
                                    <tr>
                                        <td colspan="2" align="right" style="padding: 16px 0 5px 0; font-size: 14px; color: #6b7280;">Subtotal</td>
                                        <td align="right" style="padding: 16px 0 5px 0; font-size: 14px; color: #111827;">${totalAmount}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" align="right" style="padding: 5px 0 24px 0; font-size: 16px; font-weight: 800; color: #111827;">Total Paid</td>
                                        <td align="right" style="padding: 5px 0 24px 0; font-size: 18px; font-weight: 800; color: #10b981;">${totalAmount}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- QR Code -->
                    <tr>
                        <td align="center" style="padding: 10px 40px 30px; border-top: 1px solid #f1f5f9;">
                            <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; margin-top: 15px;">
                                Scan to view ticket in Academia
                            </div>

                            <img src="${qr_code_base64}" alt="Ticket QR Code" width="170" style="display: block; margin: auto; border: 8px solid #f8fafc; border-radius: 12px;" />

                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px;">
                    <tr>
                        <td align="center" class="content-padding" style="padding-top: 24px;">
                            <img src="https://opencrafts.io/images/logo.svg" alt="Academia Logo" width="90" style="display: block; border: 0; margin-bottom: 12px; opacity: 0.7;">
                            
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                                &copy; ${currentYear} Opencrafts. All rights reserved.
                            </p>
                            <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                                We believe in software that is fun, free and transparent.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`;

    return email;
}



export async function sendEventConfirmedEmail(
    organizer_name = "Organizer",
    event_name,
    event_description,
    event_location,
    start_date,
    end_date,
    event_banner_image,
    scope = "public",
    created_at
) {
    // Explicit date formatting with time included
    const formatDate = (d) => {
        if (!d) return null;
        return new Date(d).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC' // Adjust or remove if using local time strings
        });
    };

    const formattedStart = formatDate(start_date);
    const formattedDate = formatDate(created_at);
    const formattedEnd = formatDate(end_date);
    const currentYear = new Date().getFullYear();
    
    const email = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Confirmed</title>
    <style>
        @media screen and (max-width: 600px) {
            .wrapper-padding { padding: 20px 10px !important; }
            .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
            .inner-card-padding { padding: 16px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" class="wrapper-padding" style="padding: 40px 0;">
                
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden;">
                    
                    <!-- Top Accent Bar -->
                    <tr>
                        <td height="6" style="background-color: #4f46e5; line-height: 6px; font-size: 6px;">&nbsp;</td>
                    </tr>

                    ${event_banner_image ? `
                    <!-- Optional Event Banner Image -->
                    <tr>
                        <td>
                            <img src="${event_banner_image}" alt="${event_name}" style="width: 100%; max-height: 200px; object-fit: cover; display: block;" />
                        </td>
                    </tr>
                    ` : ''}

                    <!-- Branding & Greeting -->
                    <tr>
                        <td class="content-padding" style="padding: 36px 40px 20px 40px;">
                           
                            <div style="background-color: #ecfdf5; color: #059669; display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px;">
                                ✓ Event Live & Published
                            </div>

                            <h1 style="margin: 0 0 12px 0; color: #111827; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.3;">
                                Hello ${organizer_name},
                            </h1>
                            
                            <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                Your event <strong style="color: #111827;">${event_name}</strong> is now live and accessible on Academia! You can manage registrations and track updates right from your dashboard.
                            </p>
                        </td>
                    </tr>

                    <!-- Slick Event Details Card -->
                    <tr>
                        <td class="content-padding" style="padding: 10px 40px 0 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="inner-card-padding" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">Event Overview</p>
                                        <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 18px; font-weight: 700; line-height: 1.3;">${event_name}</h2>
                                        
                                        ${event_description ? `
                                        <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 1.5; border-bottom: 1px dashed #e2e8f0; padding-bottom: 12px;">
                                            ${event_description}
                                        </p>
                                        ` : ''}

                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #4b5563;">
                                            ${event_location ? `
                                            <tr>
                                                <td style="padding: 8px 0; line-height: 1.4;">
                                                    <span style="color: #94a3b8; display: inline-block; min-width: 80px; font-weight: 600; text-transform: uppercase; font-size: 11px;">Location:</span> 
                                                    <span style="color: #111827; font-weight: 600;"> ${event_location}</span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            
                                            ${(formattedStart || formattedEnd) ? `
                                            <tr>
                                                <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; line-height: 1.4;">
                                                    <span style="color: #94a3b8; display: inline-block; min-width: 80px; font-weight: 600; text-transform: uppercase; font-size: 11px;">Date & Time:</span> 
                                                    <span style="color: #111827; font-weight: 600;"> ${formattedStart || ''} ${formattedEnd ? `– ${formattedEnd}` : ''}</span>
                                                </td>
                                            </tr>
                                            ` : ''}

                                            <tr>
                                                <td style="padding: 8px 0; border-top: 1px solid #f1f5f9; line-height: 1.4;">
                                                    <span style="color: #94a3b8; display: inline-block; min-width: 80px; font-weight: 600; text-transform: uppercase; font-size: 11px;">Visibility:</span> 
                                                    <span style="color: #4f46e5; font-weight: 700; text-transform: capitalize;">${scope}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Created Metadata -->
                    <tr>
                        <td class="content-padding" style="padding: 20px 40px 30px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                Published on ${formattedDate}
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Dynamic Footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px;">
                    <tr>
                        <td align="center" class="content-padding" style="padding-top: 24px;">
                            <img src="https://opencrafts.io/images/logo.svg" alt="Academia Logo" width="90" style="display: block; border: 0; margin-bottom: 12px; opacity: 0.7;">
                            
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                                &copy; ${currentYear} Opencrafts. All rights reserved.
                            </p>
                            <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                                We believe in software that is fun, free and transparent.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`;

    return email;
}