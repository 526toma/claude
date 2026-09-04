# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, KeepTogether)

F = "IPAGothic"
pdfmetrics.registerFont(TTFont(F, "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"))
pdfmetrics.registerFont(TTFont("IPAPGothic", "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf"))
registerFontFamily(F, normal=F, bold=F, italic=F, boldItalic=F)
FP = "IPAPGothic"
registerFontFamily(FP, normal=FP, bold=FP, italic=FP, boldItalic=FP)

NAVY   = colors.HexColor("#1F3864")
ACCENT = colors.HexColor("#C00000")
LIGHT  = colors.HexColor("#EAF0F8")
GREY   = colors.HexColor("#666666")
LINE   = colors.HexColor("#B8C4D9")

def S(name, **kw):
    kw.setdefault("fontName", FP)
    kw.setdefault("wordWrap", "CJK")
    kw.setdefault("leading", kw.get("fontSize", 10) * 1.75)
    return ParagraphStyle(name, **kw)

st_date   = S("date", fontSize=9.5, alignment=TA_RIGHT, textColor=GREY)
st_from   = S("from", fontSize=9.5, alignment=TA_RIGHT, leading=15)
st_fromhd = S("fromhd", fontSize=12, alignment=TA_RIGHT, leading=18, textColor=NAVY)
st_to     = S("to", fontSize=12, alignment=TA_LEFT)
st_title  = S("title", fontSize=17, alignment=TA_CENTER, textColor=colors.white, leading=25)
st_sub    = S("sub", fontSize=10.5, alignment=TA_CENTER, textColor=colors.white, leading=16)
st_body   = S("body", fontSize=10.5, leading=18)
st_lead   = S("lead", fontSize=11, leading=20)
st_kihd   = S("kihd", fontSize=12, textColor=colors.white, leading=17)
st_cell   = S("cell", fontSize=10.5, leading=16)
st_cellb  = S("cellb", fontSize=13, leading=18, textColor=NAVY)
st_lbl    = S("lbl", fontSize=10, leading=15, textColor=colors.white)
st_note   = S("note", fontSize=10, leading=16)
st_small  = S("small", fontSize=9, leading=13, textColor=GREY)
st_box1   = S("box1", fontSize=13.5, leading=21, textColor=NAVY)
st_box2   = S("box2", fontSize=10, leading=16, textColor=colors.HexColor("#333333"))
st_end    = S("end", fontSize=10.5, alignment=TA_RIGHT)

W, H = A4
MARGIN = 18 * mm
CW = W - 2 * MARGIN

def bar(text, sub=None, color=NAVY):
    """Full-width colored heading bar."""
    rows = [[Paragraph(text, st_title)]]
    if sub:
        rows.append([Paragraph(sub, st_sub)])
    t = Table(rows, colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t

def section(num, text):
    t = Table([[Paragraph("%s" % num, S("n", fontSize=11, textColor=colors.white, alignment=TA_CENTER)),
                Paragraph(text, S("s", fontSize=12, textColor=NAVY, leading=17))]],
              colWidths=[9 * mm, CW - 9 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (1, 0), (1, 0), 7),
        ("LINEBELOW", (1, 0), (1, 0), 1, LINE),
    ]))
    return t

def BL(n):
    return "＿" * n

story = []
A = story.append

# ---------- header ----------
A(Paragraph("令和8年　" + BL(2) + " 月 " + BL(2) + " 日", st_date))
A(Spacer(1, 5))
A(Paragraph("入居者各位", st_to))
A(Spacer(1, 2))
A(Paragraph("物件名：" + BL(16), S("p", fontSize=10.5, textColor=colors.HexColor("#333333"), leading=17)))
A(Spacer(1, 6))
A(Paragraph("有限会社　大成住宅", st_fromhd))
A(Paragraph(
    "〒" + BL(3) + "－" + BL(4) + "　" + BL(14) + "<br/>"
    "TEL：" + BL(4) + "－" + BL(3) + "－" + BL(4) + "　／　FAX：" + BL(4) + "－" + BL(3) + "－" + BL(4) + "<br/>"
    "担当：" + BL(7), st_from))
A(Spacer(1, 8))

# ---------- title ----------
A(bar("管理会社の変更と 家賃お振込先変更のお知らせ",
      "12月1日より 建物の管理業務は 有限会社大成住宅 が承ります"))
A(Spacer(1, 10))

# ---------- greeting ----------
A(Paragraph(
    "拝啓　時下ますますご清栄のこととお慶び申し上げます。平素は格別のご高配を賜り、厚く御礼申し上げます。", st_body))
A(Spacer(1, 5))
A(Paragraph(
    "この度、貸主様のご意向により、<b>令和8年12月1日</b>をもちまして、本物件の管理業務を弊社が引き継ぐこととなりました。"
    "これに伴い、<b>お家賃のお振込先が変更</b>となります。お手数をおかけいたしますが、下記をご確認のうえ、"
    "お振込先の変更をお願い申し上げます。", st_body))
A(Spacer(1, 5))
A(Paragraph(
    "なお、<b>賃貸借契約の内容（お家賃の額・契約期間・お支払期日などの条件）に変更はございません。</b>"
    "今後とも安心してお住まいいただけますよう努めてまいります。", st_body))
A(Spacer(1, 6))
A(Paragraph("敬具", st_end))
A(Spacer(1, 4))

# ---------- at-a-glance box ----------
box = Table([[Paragraph("こ<br/>こ<br/>が<br/>変<br/>わ<br/>り<br/>ま<br/>す",
                        S("v", fontSize=10, alignment=TA_CENTER, textColor=colors.white, leading=13)),
              Paragraph(
                  "① 管理会社が変わります<br/>"
                  '<font size="10" color="#333333">令和8年12月1日から　→　有限会社　大成住宅<br/>'
                  'これまでの管理会社： ' + BL(12) + '</font><br/><font size="5"><br/></font>'
                  "② 家賃のお振込先が変わります<br/>"
                  '<font size="10" color="#333333">令和8年12月分のお家賃から　→　新しい口座へ（下記1をご覧ください）</font>',
                  st_box1)]],
            colWidths=[13 * mm, CW - 13 * mm])
box.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), ACCENT),
    ("BACKGROUND", (1, 0), (1, 0), LIGHT),
    ("BOX", (0, 0), (-1, -1), 1.2, ACCENT),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (1, 0), (1, 0), 12),
]))
A(box)
A(Spacer(1, 8))

A(Paragraph("記", S("ki", fontSize=12, alignment=TA_CENTER, textColor=NAVY)))
A(Spacer(1, 6))

# ---------- 2. new bank account ----------
_sec2 = [section("1", "新しいお振込先（令和8年12月分のお家賃から）"), Spacer(1, 5)]
t2 = Table([
    [Paragraph("金融機関名", st_lbl), Paragraph(BL(7) + " 銀行 　 " + BL(5) + " 支店", st_cellb)],
    [Paragraph("預金種別", st_lbl), Paragraph("普通預金", st_cellb)],
    [Paragraph("口座番号", st_lbl), Paragraph(BL(9), st_cellb)],
    [Paragraph("口座名義", st_lbl), Paragraph("有限会社　大成住宅", st_cellb)],
    [Paragraph("口座名義（カナ）", st_lbl), Paragraph("ユウゲンガイシャ　タイセイジユウタク", st_cellb)],
], colWidths=[38 * mm, CW - 38 * mm])
t2.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), NAVY),
    ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#FFF9E6")),
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("BOX", (0, 0), (-1, -1), 1.2, ACCENT),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 4.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
]))
_sec2 += [t2, Spacer(1, 6), Paragraph(
    "※ お振込みの際は、通信欄・依頼人名に <b>「お部屋番号＋ご契約者名」</b> をご入力ください。"
    "（例：<b>101ヤマダタロウ</b>）<br/>"
    "※ お支払期日は従来どおり <b>毎月 " + BL(2) + " 日まで（翌月分前払い）</b> です。<br/>"
    "※ お振込手数料は、恐れ入りますが入居者様のご負担でお願いいたします。", st_small)]
A(KeepTogether(_sec2))
A(Spacer(1, 14))

# ---------- 3. important notes ----------
A(section("2", "大切なお願い・ご注意"))
A(Spacer(1, 5))

notes = [
    ("旧口座は使えなくなります",
     "これまでの口座（" + BL(10) + "）は <b>令和8年11月30日</b> をもってご利用いただけません。"
     "誤ってお振込みされますと、返金のお手続きにお時間をいただくことになります。"),
    ("自動振込をご利用の方",
     "銀行の自動振込（定期振込）をご登録の方は、<b>お客様ご自身での変更手続きが必要</b>です。"
     "11月中にお手続きくださいますようお願いいたします。"),
    ("口座振替をご利用の方",
     "新しい口座振替依頼書を別途お送りいたします。ご記入・ご捺印のうえご返送ください。"
     "切替が完了するまでの間は、上記1の口座へお振込みをお願いいたします。"),
    ("敷金・保証金について",
     "お預かりしている敷金・保証金は弊社が引き継ぎます。ご退去時の精算も弊社にて対応いたしますので、ご安心ください。"),
    ("設備の不具合・ご相談",
     "12月1日以降、水漏れ・設備の故障などのご連絡、その他お住まいに関するご相談は、すべて弊社までお願いいたします。"),
]
rows = []
for i, (h, b) in enumerate(notes, 1):
    rows.append([Paragraph("●", S("b", fontSize=9, textColor=ACCENT, alignment=TA_CENTER)),
                 Paragraph('<font color="#1F3864" size="11">%s</font><br/>%s' % (h, b), st_note)])
t3 = Table(rows, colWidths=[7 * mm, CW - 7 * mm])
t3.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (1, 0), (1, -1), 3),
    ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#DDDDDD")),
]))
A(t3)
A(Spacer(1, 14))

# ---------- 4. contact ----------
_sec3 = [section("3", "お問い合わせ先"), Spacer(1, 5)]
c = Table([[Paragraph(
    '<font size="13" color="#1F3864">有限会社　大成住宅</font>　'
    '<font size="10">担当：' + BL(7) + '</font><br/><br/>'
    '<font size="15" color="#C00000">TEL　' + BL(4) + '－' + BL(3) + '－' + BL(4) + '</font><br/>'
    '<font size="9.5" color="#333333">受付時間： ' + BL(3) + ' 時 ～ ' + BL(3) + ' 時　／　定休日： ' + BL(5) + '</font><br/>'
    '<font size="10">メール：' + BL(14) + '</font><br/>'
    '<font size="10">夜間・休日の緊急連絡先（水漏れ等）：' + BL(4) + '－' + BL(3) + '－' + BL(4) + '</font>',
    S("c", fontSize=10, leading=17))]], colWidths=[CW])
c.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
    ("BOX", (0, 0), (-1, -1), 0.8, LINE),
    ("TOPPADDING", (0, 0), (-1, -1), 11),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
]))
_sec3.append(c)
A(KeepTogether(_sec3))
A(Spacer(1, 10))
A(Paragraph("以上", st_end))


def deco(canv, doc):
    canv.saveState()
    canv.setStrokeColor(NAVY)
    canv.setLineWidth(2.5)
    canv.line(MARGIN, H - 12 * mm, W - MARGIN, H - 12 * mm)
    canv.setFont(FP, 8)
    canv.setFillColor(GREY)
    canv.drawCentredString(W / 2, 10 * mm, "有限会社　大成住宅　／　管理会社変更・家賃お振込先変更のお知らせ　－　%d －" % doc.page)
    canv.restoreState()


doc = BaseDocTemplate("管理会社変更・振込先変更のお知らせ.pdf",
                      pagesize=A4,
                      leftMargin=MARGIN, rightMargin=MARGIN,
                      topMargin=16 * mm, bottomMargin=15 * mm,
                      title="管理会社変更および家賃お振込先変更のお知らせ",
                      author="有限会社 大成住宅")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="n",
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=deco)])
doc.build(story)
print("OK")
