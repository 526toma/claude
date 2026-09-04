# -*- coding: utf-8 -*-
"""入居者向け「管理会社変更・家賃振込先変更のお知らせ」— 和文ビジネスレター体裁"""
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

M  = "IPAPMincho"   # 本文（プロポーショナル明朝）
MF = "IPAMincho"    # 等幅明朝
pdfmetrics.registerFont(TTFont(MF, "/usr/share/fonts/opentype/ipafont-mincho/ipam.ttf"))
pdfmetrics.registerFont(TTFont(M,  "/usr/share/fonts/opentype/ipafont-mincho/ipamp.ttf"))
for f in (M, MF):
    registerFontFamily(f, normal=f, bold=f, italic=f, boldItalic=f)

BLACK = colors.black
RULE  = colors.HexColor("#333333")

W, H   = A4
LR     = 18 * mm
TOP    = 16 * mm
BOT    = 13 * mm
CW     = W - 2 * LR

def S(name, **kw):
    kw.setdefault("fontName", M)
    kw.setdefault("wordWrap", "CJK")
    kw.setdefault("fontSize", 10.5)
    kw.setdefault("leading", kw["fontSize"] * 1.6)
    kw.setdefault("textColor", BLACK)
    return ParagraphStyle(name, **kw)

st_date  = S("date",  alignment=TA_RIGHT)
st_to    = S("to",    fontSize=11)
st_from  = S("from",  alignment=TA_RIGHT, leading=15)
st_title = S("title", fontSize=13.5, alignment=TA_CENTER, leading=20)
st_body  = S("body",  leading=16.8, firstLineIndent=10.5)   # 段落一字下げ
st_plain = S("plain", leading=16.5)
st_right = S("right", alignment=TA_RIGHT)
st_ki    = S("ki",    fontSize=11, alignment=TA_CENTER, leading=16)
st_item  = S("item",  leading=16.8, leftIndent=21, firstLineIndent=-21)  # 「1．」ぶら下げ
st_sub   = S("sub",   fontSize=10, leading=16, leftIndent=21)
st_sub2  = S("sub2",  fontSize=10, leading=16, leftIndent=42, firstLineIndent=-21)
st_cell  = S("cell",  leading=14.5)
st_note  = S("note",  fontSize=9.5, leading=13.5, leftIndent=21)

SP = "&nbsp;&nbsp;"   # 全角一字分の空き

def BL(n):
    """記入用の下線（全角アンダーライン）"""
    return "＿" * n

story = []
A = story.append

# ── 日付・宛名・差出人 ─────────────────────────────
A(Paragraph("令和8年　" + BL(2) + " 月 " + BL(2) + " 日", st_date))
A(Spacer(1, 10))
A(Paragraph("入居者各位", st_to))
A(Spacer(1, 9))
A(Paragraph(
    "〒" + BL(3) + "－" + BL(4) + "　" + BL(13) + "<br/>"
    "有限会社　大成住宅<br/>"
    "電話" + SP + BL(4) + "－" + BL(3) + "－" + BL(4) + "<br/>"
    "担当" + SP + BL(6), st_from))
A(Spacer(1, 20))

# ── 件名 ────────────────────────────────────────
A(Paragraph("建物管理業務の変更および家賃お振込先変更のお知らせ", st_title))
A(Spacer(1, 11))

# ── 本文 ────────────────────────────────────────
A(Paragraph(
    "拝啓" + SP + "時下ますますご清栄のこととお慶び申し上げます。"
    "平素は格別のご高配を賜り、厚く御礼申し上げます。", st_body))
A(Paragraph(
    "さて、この度、貸主様のご意向により、令和8年12月1日をもちまして、"
    "下記物件の建物管理業務を弊社が承ることとなりました。"
    "これに伴いまして、令和8年12月分のお家賃より、お振込先が下記のとおり変更となります。"
    "お手数をおかけいたしますが、お振込先の変更手続きにつきまして、何卒よろしくお願い申し上げます。", st_body))
A(Paragraph(
    "なお、賃貸借契約の内容（お家賃の額・契約期間・お支払期日等の条件）に変更はございません。"
    "今後とも安心してお住まいいただけますよう努めてまいります。", st_body))
A(Paragraph(
    "まずは略儀ながら、書面をもちましてご挨拶かたがたご案内申し上げます。", st_body))
A(Spacer(1, 3))
A(Paragraph("敬具", st_right))
A(Spacer(1, 14))

# ── 記 ─────────────────────────────────────────
A(Paragraph("記", st_ki))
A(Spacer(1, 8))

A(Paragraph("1．" + SP + "物件名" + SP * 2 + BL(15), st_item))
A(Spacer(1, 6))

A(Paragraph("2．" + SP + "管理業務の変更日" + SP * 2 + "令和8年12月1日", st_item))
A(Paragraph("これまでの管理会社" + SP + BL(14), st_sub))
A(Spacer(1, 7))

# 振込先
bank = [
    ["金融機関名", BL(8) + " 銀行" + SP * 2 + BL(6) + " 支店"],
    ["預金種別", "普通預金"],
    ["口座番号", BL(10)],
    ["口座名義", "有限会社" + SP + "大成住宅" + SP + "（ユウゲンガイシャ" + SP + "タイセイジユウタク）"],
]
t = Table([[Paragraph(a, st_cell), Paragraph(b, st_cell)] for a, b in bank],
          colWidths=[32 * mm, CW - 21 * mm - 32 * mm])
t.setStyle(TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.7, RULE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 4.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
]))
tw = Table([[t]], colWidths=[CW])
tw.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 21),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))

A(KeepTogether([
    Paragraph("3．" + SP + "新しいお振込先（令和8年12月分のお家賃より）", st_item),
    Spacer(1, 4),
    tw,
]))
A(Spacer(1, 8))

_c4 = [Paragraph("4．" + SP + "ご注意事項", st_item)]
for n, txt in [
    ("(1)", "これまでのお振込先（" + BL(9) + "）は、令和8年11月30日をもってご利用いただけません。"
            "誤ってお振込みされた場合、返金のお手続きにお時間を頂戴いたします。"),
    ("(2)", "銀行の自動振込（定期振込）をご利用の方は、お客様ご自身での登録変更のお手続きが必要でございます。"
            "11月中にお手続きくださいますようお願い申し上げます。"),
    ("(3)", "12月1日以降、水漏れ・設備の故障等のご連絡、その他お住まいに関するご相談は、"
            "すべて弊社までお願い申し上げます。"),
]:
    _c4.append(Paragraph("%s%s%s" % (n, SP, txt), st_sub2))
A(KeepTogether(_c4[:2]))
for _f in _c4[2:]:
    A(_f)
A(Spacer(1, 8))

A(KeepTogether([
    Paragraph("5．" + SP + "お問い合わせ先", st_item),
    Paragraph(
        "有限会社" + SP + "大成住宅" + SP * 2 + "担当" + SP + BL(6) + "<br/>"
        "電話" + SP + BL(4) + "－" + BL(3) + "－" + BL(4) + "　（受付時間　" + BL(3) + " 時 ～ " + BL(3) + " 時／定休日　" + BL(4) + "）", st_sub),
]))
A(Spacer(1, 9))
A(Paragraph("以上", st_right))


def footer(canv, doc):
    if doc.page > 1:
        canv.saveState()
        canv.setFont(M, 9)
        canv.setFillColor(colors.HexColor("#555555"))
        canv.drawCentredString(W / 2, 12 * mm, "－ %d －" % doc.page)
        canv.restoreState()


doc = BaseDocTemplate("管理会社変更・振込先変更のお知らせ.pdf",
                      pagesize=A4, leftMargin=LR, rightMargin=LR,
                      topMargin=TOP, bottomMargin=BOT,
                      title="建物管理業務の変更および家賃お振込先変更のお知らせ",
                      author="有限会社 大成住宅")
doc.addPageTemplates([PageTemplate(id="all", onPage=footer, frames=[
    Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="n",
          leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)])])
doc.build(story)
print("OK")
