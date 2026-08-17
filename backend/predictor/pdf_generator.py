import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


def generate_prediction_pdf(prediction, user=None):
    """
    Generates a professional, branded PDF valuation report for a given Prediction instance.
    Returns bytes of the PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom color palette
    c_primary = colors.HexColor("#0F172A")    # Deep Slate
    c_gold = colors.HexColor("#C89B5D")       # Luxury Gold
    c_dark_gold = colors.HexColor("#A07234")  # Dark Gold
    c_light_gold = colors.HexColor("#FAF5EE") # Warm Pale Gold
    c_card_bg = colors.HexColor("#F8FAFC")    # Cool Light Slate
    c_text_dark = colors.HexColor("#0F172A")  # Slate 900
    c_text_muted = colors.HexColor("#64748B") # Slate 500
    c_border = colors.HexColor("#E2E8F0")     # Light Border
    c_white = colors.HexColor("#FFFFFF")

    # Typography styles
    style_brand = ParagraphStyle(
        "BrandTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=c_gold,
    )
    style_brand_sub = ParagraphStyle(
        "BrandSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=c_text_muted,
    )
    style_report_title = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        alignment=2,  # Right aligned
        textColor=c_primary,
    )
    style_report_meta = ParagraphStyle(
        "ReportMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=2,  # Right aligned
        textColor=c_text_muted,
    )
    style_section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=c_primary,
        spaceAfter=6,
    )
    style_th = ParagraphStyle(
        "TH",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=c_text_muted,
    )
    style_td = ParagraphStyle(
        "TD",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=c_text_dark,
    )
    style_td_bold = ParagraphStyle(
        "TDBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=c_text_dark,
    )
    style_hero_label = ParagraphStyle(
        "HeroLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=1,  # Center
        textColor=c_dark_gold,
    )
    style_hero_price = ParagraphStyle(
        "HeroPrice",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        alignment=1,  # Center
        textColor=c_primary,
    )
    style_hero_inr = ParagraphStyle(
        "HeroINR",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=1,  # Center
        textColor=c_dark_gold,
    )
    style_hero_sub = ParagraphStyle(
        "HeroSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=1,  # Center
        textColor=c_text_muted,
    )
    style_disclaimer = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        alignment=1,  # Center
        textColor=c_text_muted,
    )

    story = []

    # 1. Header (Logo & Report Header)
    user_name = "Guest User"
    user_email = "N/A"
    if user and user.is_authenticated:
        user_name = user.get_full_name() or user.username
        user_email = user.email or "N/A"

    created_time = (
        prediction.created_at.strftime("%d %B %Y, %I:%M %p")
        if getattr(prediction, "created_at", None)
        else datetime.now().strftime("%d %B %Y, %I:%M %p")
    )

    header_data = [
        [
            Paragraph("<b>ESTATEPREDICT</b>", style_brand),
            Paragraph("PROPERTY VALUATION REPORT", style_report_title),
        ],
        [
            Paragraph("AI-Powered Hyderabad Real Estate Intelligence", style_brand_sub),
            Paragraph(f"Report ID: <b>#EP-PRED-{prediction.id or 'NEW'}</b><br/>Generated: {created_time}", style_report_meta),
        ],
    ]
    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ])
    )
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_gold, spaceBefore=2, spaceAfter=10))

    # 2. Client & Subject Summary
    client_data = [
        [
            Paragraph("<b>PREPARED FOR</b>", style_th),
            Paragraph("<b>CLIENT EMAIL</b>", style_th),
            Paragraph("<b>LOCALITY</b>", style_th),
            Paragraph("<b>PROPERTY TYPE</b>", style_th),
        ],
        [
            Paragraph(user_name, style_td_bold),
            Paragraph(user_email, style_td),
            Paragraph(f"{prediction.locality}, Hyderabad", style_td_bold),
            Paragraph(prediction.property_type, style_td_bold),
        ],
    ]
    client_table = Table(client_data, colWidths=[135, 145, 140, 120])
    client_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_card_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, c_border),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(client_table)
    story.append(Spacer(1, 12))

    # 3. Valuation Hero Banner
    area_num = float(prediction.area_sqft or 0)
    inr_num = float(prediction.predicted_price_inr or (prediction.predicted_price_lakhs * 100000))
    lakhs_num = float(prediction.predicted_price_lakhs)
    price_per_sqft = int(inr_num / area_num) if area_num > 0 else 0

    hero_content = [
        [Paragraph("ESTIMATED MARKET VALUATION", style_hero_label)],
        [Paragraph(f"₹ {lakhs_num:.2f} Lakhs", style_hero_price)],
        [Paragraph(f"₹ {inr_num:,.2f} INR", style_hero_inr)],
        [Spacer(1, 2)],
        [
            Paragraph(
                f"Estimated Rate: <b>₹ {price_per_sqft:,} / sq.ft.</b> &nbsp;|&nbsp; Location: <b>{prediction.locality}</b> &nbsp;|&nbsp; Configuration: <b>{prediction.bedrooms} BHK</b>",
                style_hero_sub,
            )
        ],
    ]
    hero_table = Table(hero_content, colWidths=[540])
    hero_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_light_gold),
            ("BOX", (0, 0), (-1, -1), 1, c_gold),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ])
    )
    story.append(hero_table)
    story.append(Spacer(1, 14))

    # 4. Property Specifications Table
    story.append(Paragraph("PROPERTY SPECIFICATIONS", style_section_heading))

    spec_rows = [
        [
            Paragraph("Locality", style_th),
            Paragraph(f"{prediction.locality}, Hyderabad", style_td_bold),
            Paragraph("Property Type", style_th),
            Paragraph(str(prediction.property_type), style_td_bold),
        ],
        [
            Paragraph("Super Built-up Area", style_th),
            Paragraph(f"{area_num:g} sq.ft.", style_td),
            Paragraph("Configuration", style_th),
            Paragraph(f"{prediction.bedrooms} BHK ({prediction.bathrooms:g} Bath)", style_td),
        ],
        [
            Paragraph("Balconies", style_th),
            Paragraph(str(prediction.balconies), style_td),
            Paragraph("Floor Elevation", style_th),
            Paragraph(f"Floor {prediction.floor} of {prediction.total_floors}", style_td),
        ],
        [
            Paragraph("Property Age", style_th),
            Paragraph(f"{prediction.property_age} Years", style_td),
            Paragraph("Furnishing Status", style_th),
            Paragraph(str(prediction.furnished), style_td),
        ],
        [
            Paragraph("Facing Direction", style_th),
            Paragraph(str(prediction.facing or "East"), style_td),
            Paragraph("Water Supply", style_th),
            Paragraph(str(prediction.water_supply or "24x7"), style_td),
        ],
        [
            Paragraph("Reserved Parking", style_th),
            Paragraph(f"{prediction.parking} Covered Slot(s)", style_td),
            Paragraph("Security & Surveillance", style_th),
            Paragraph(str(prediction.security or "No"), style_td),
        ],
    ]
    spec_table = Table(spec_rows, colWidths=[125, 145, 125, 145])
    spec_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_card_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, c_border),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(spec_table)
    story.append(Spacer(1, 12))

    # 5. Amenities & Infrastructure Connectivity
    story.append(Paragraph("AMENITIES & LOCALITY CONNECTIVITY", style_section_heading))

    metro_dist = f"{prediction.distance_metro_km:g} km" if prediction.distance_metro_km is not None else "N/A"
    school_dist = f"{prediction.distance_school_km:g} km" if prediction.distance_school_km is not None else "N/A"
    hospital_dist = f"{prediction.distance_hospital_km:g} km" if prediction.distance_hospital_km is not None else "N/A"

    amenities_rows = [
        [
            Paragraph("Lift Available", style_th),
            Paragraph(str(prediction.lift or "No"), style_td),
            Paragraph("Distance to Metro", style_th),
            Paragraph(metro_dist, style_td_bold),
        ],
        [
            Paragraph("Power Backup", style_th),
            Paragraph(str(prediction.power_backup or "No"), style_td),
            Paragraph("Distance to School", style_th),
            Paragraph(school_dist, style_td),
        ],
        [
            Paragraph("Gymnasium", style_th),
            Paragraph(str(prediction.gym or "No"), style_td),
            Paragraph("Distance to Hospital", style_th),
            Paragraph(hospital_dist, style_td),
        ],
        [
            Paragraph("Swimming Pool", style_th),
            Paragraph(str(prediction.swimming_pool or "No"), style_td),
            Paragraph("Market Segment", style_th),
            Paragraph("Residential Growth Corridor", style_td),
        ],
    ]
    amenities_table = Table(amenities_rows, colWidths=[125, 145, 125, 145])
    amenities_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_card_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, c_border),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(amenities_table)
    story.append(Spacer(1, 14))

    # 6. Valuation Methodology & Disclaimer
    disclaimer_text = (
        "<b>Important Notice & Disclaimer:</b> This valuation report is automatically computed by EstatePredict's "
        "trained Machine Learning algorithm based on market intelligence and historical transaction data across Hyderabad. "
        "This estimate is intended solely for reference, advisory, and planning purposes. It does not constitute a statutory "
        "government appraisal or a legally binding financial guarantee."
    )
    disclaimer_table = Table(
        [[Paragraph(disclaimer_text, style_disclaimer)]],
        colWidths=[540],
    )
    disclaimer_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, c_border),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(disclaimer_table)

    # Build document
    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
