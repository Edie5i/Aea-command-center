#!/usr/bin/env python3
"""
Genera un PDF imprimible con tarjetas de QR para pedir reseñas en Google.

Diseño vertical tipo tarjeta de mesa: logo de la escuela arriba, anillo con los
colores de Google al centro y QR grande abajo.

El QR apunta al mismo enlace de reseñas que ya usa la app (landing, agenda y
encuesta de satisfacción), para no tener dos destinos distintos circulando.

Uso:
    python generar_tarjetas_qr.py
    python generar_tarjetas_qr.py --paginas 5
    python generar_tarjetas_qr.py --salida tarjetas.pdf --filas 3 --columnas 3
"""

import argparse
import io
import os
from typing import Optional

import qrcode
from PIL import Image, ImageDraw
from qrcode.constants import ERROR_CORRECT_H
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

URL_RESENA = "https://g.page/r/CXb43zwsdca7EBE/review"
LOGO = "public/icons/icon-512x512.png"

TITULO = "Tu opinión es importante"
CALIFICANOS = "Califícanos en"
PIE = "Escanea con la cámara de tu celular"

# Tarjeta vertical; 3x3 entran en carta con margen cómodo
ANCHO_TARJETA = 54 * mm
ALTO_TARJETA = 86 * mm
RADIO = 4 * mm

AZUL = HexColor("#4285F4")
ROJO = HexColor("#EA4335")
AMARILLO = HexColor("#FBBC05")
VERDE = HexColor("#34A853")
NARANJA = HexColor("#FB8C00")

GRIS_CORTE = Color(0.80, 0.80, 0.80)
GRIS_TEXTO = Color(0.35, 0.35, 0.35)

# Colores del wordmark, letra por letra
GOOGLE = [("G", AZUL), ("o", ROJO), ("o", AMARILLO), ("g", AZUL), ("l", VERDE), ("e", ROJO)]


def imagen_qr(url: str) -> ImageReader:
    """QR con corrección de errores alta: aguanta impresión mediocre y dobleces."""
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H, box_size=10, border=0)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def imagen_logo(ruta: str) -> Optional[ImageReader]:
    """
    Recorta el logo en círculo sobre fondo blanco. El PNG original trae un
    cuadro gris claro alrededor del disco azul, que sobre la tarjeta blanca se
    vería como un recuadro sucio.
    """
    if not os.path.exists(ruta):
        return None

    logo = Image.open(ruta).convert("RGB")
    lado = min(logo.size)
    izq = (logo.width - lado) // 2
    arr = (logo.height - lado) // 2
    logo = logo.crop((izq, arr, izq + lado, arr + lado))

    mascara = Image.new("L", (lado, lado), 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, lado - 1, lado - 1), fill=255)

    fondo = Image.new("RGB", (lado, lado), "white")
    fondo.paste(logo, (0, 0), mascara)

    buf = io.BytesIO()
    fondo.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def esquinas_color(c: canvas.Canvas, x: float, y: float) -> None:
    """Cuñas de color en las 4 esquinas, recortadas al contorno redondeado."""
    c.saveState()
    recorte = c.beginPath()
    recorte.roundRect(x, y, ANCHO_TARJETA, ALTO_TARJETA, RADIO)
    c.clipPath(recorte, stroke=0, fill=0)

    lado = 9 * mm
    esquinas = [
        (VERDE,    [(x, y + ALTO_TARJETA), (x + lado, y + ALTO_TARJETA), (x, y + ALTO_TARJETA - lado)]),
        (NARANJA,  [(x + ANCHO_TARJETA, y + ALTO_TARJETA), (x + ANCHO_TARJETA - lado, y + ALTO_TARJETA), (x + ANCHO_TARJETA, y + ALTO_TARJETA - lado)]),
        (AZUL,     [(x, y), (x + lado, y), (x, y + lado)]),
        (ROJO,     [(x + ANCHO_TARJETA, y), (x + ANCHO_TARJETA - lado, y), (x + ANCHO_TARJETA, y + lado)]),
    ]
    for color, pts in esquinas:
        p = c.beginPath()
        p.moveTo(*pts[0])
        for pt in pts[1:]:
            p.lineTo(*pt)
        p.close()
        c.setFillColor(color)
        c.drawPath(p, stroke=0, fill=1)

    c.restoreState()


def anillo(c: canvas.Canvas, cx: float, cy: float, radio: float) -> None:
    """Anillo de 4 arcos en los colores de Google, con huecos entre ellos."""
    grosor = 2.6
    c.setLineWidth(grosor)
    c.setLineCap(0)
    x1, y1 = cx - radio, cy - radio
    x2, y2 = cx + radio, cy + radio

    # (color, ángulo inicial, extensión) — huecos de 8° entre cuadrantes
    for color, ini, ext in [(VERDE, 94, 82), (AZUL, 184, 82), (ROJO, 274, 82), (NARANJA, 4, 82)]:
        p = c.beginPath()
        p.arc(x1, y1, x2, y2, ini, ext)
        c.setStrokeColor(color)
        c.drawPath(p, stroke=1, fill=0)


def wordmark_google(c: canvas.Canvas, cx: float, y: float, tam: float) -> None:
    """Dibuja 'Google' letra por letra con los colores de la marca."""
    c.setFont("Helvetica-Bold", tam)
    ancho = sum(c.stringWidth(letra, "Helvetica-Bold", tam) for letra, _ in GOOGLE)
    cursor = cx - ancho / 2
    for letra, color in GOOGLE:
        c.setFillColor(color)
        c.drawString(cursor, y, letra)
        cursor += c.stringWidth(letra, "Helvetica-Bold", tam)


def estrellas(c: canvas.Canvas, cx: float, y: float, tam: float) -> None:
    c.setFont("Helvetica", tam)
    c.setFillColor(NARANJA)
    c.drawCentredString(cx, y, "★ ★ ★ ★ ★")


def dibujar_tarjeta(c: canvas.Canvas, x: float, y: float, qr: ImageReader,
                    logo: Optional[ImageReader], lado_qr: float = 26 * mm,
                    lado_logo: float = 18 * mm) -> None:
    """
    Dibuja una tarjeta con su esquina inferior izquierda en (x, y).

    El logo se ancla arriba y el QR abajo; el anillo se ajusta solo al hueco que
    queda entre ambos. Así se pueden cambiar los dos tamaños por separado sin
    que nada se encime.
    """
    cx = x + ANCHO_TARJETA / 2
    tope = y + ALTO_TARJETA

    esquinas_color(c, x, y)

    # Contorno / guía de corte
    c.setStrokeColor(GRIS_CORTE)
    c.setLineWidth(0.4)
    c.roundRect(x, y, ANCHO_TARJETA, ALTO_TARJETA, RADIO, stroke=1, fill=0)

    # Logo anclado arriba
    if logo is not None:
        base_logo = tope - lado_logo - 4 * mm
        c.drawImage(logo, cx - lado_logo / 2, base_logo, lado_logo, lado_logo, mask="auto")
    else:
        base_logo = tope - 12 * mm
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(cx, base_logo + 2 * mm, "Auto Escuela Americana")

    # QR anclado abajo, con marco redondeado
    qr_x = cx - lado_qr / 2
    qr_y = y + 7.5 * mm
    borde_marco = 1.8 * mm
    techo_marco = qr_y + lado_qr + borde_marco

    titulo_y = base_logo - 5 * mm
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(cx, titulo_y, TITULO)

    # El anillo ocupa lo que sobra entre el título y el marco del QR
    techo_anillo = titulo_y - 3.5 * mm
    piso_anillo = techo_marco + 3 * mm
    radio_anillo = max(5 * mm, (techo_anillo - piso_anillo) / 2)
    centro_anillo = (techo_anillo + piso_anillo) / 2
    escala = min(1.0, radio_anillo / (10 * mm))

    anillo(c, cx, centro_anillo, radio_anillo)

    c.setFillColor(Color(0.25, 0.25, 0.25))
    c.setFont("Helvetica-Bold", 6.5 * escala)
    c.drawCentredString(cx, centro_anillo + 3.5 * mm * escala, CALIFICANOS)
    wordmark_google(c, cx, centro_anillo - 2 * mm * escala, 15 * escala)
    estrellas(c, cx, centro_anillo - 8 * mm * escala, 7.5 * escala)

    c.setStrokeColor(Color(0.55, 0.55, 0.55))
    c.setLineWidth(0.7)
    c.roundRect(qr_x - borde_marco, qr_y - borde_marco,
                lado_qr + 2 * borde_marco, lado_qr + 2 * borde_marco,
                1.5 * mm, stroke=1, fill=0)
    c.drawImage(qr, qr_x, qr_y, lado_qr, lado_qr)

    c.setFillColor(GRIS_TEXTO)
    c.setFont("Helvetica-Oblique", 5.2)
    c.drawCentredString(cx, y + 3.5 * mm, PIE)


def generar_individual(salida: str, url: str, ruta_logo: str, lado_qr: float,
                       lado_logo: float, margen: float = 5 * mm) -> tuple:
    """Una sola tarjeta en una página de su propio tamaño, sin hoja carta alrededor."""
    ancho_pag = ANCHO_TARJETA + 2 * margen
    alto_pag = ALTO_TARJETA + 2 * margen

    qr = imagen_qr(url)
    logo = imagen_logo(ruta_logo)

    c = canvas.Canvas(salida, pagesize=(ancho_pag, alto_pag))
    c.setTitle("Tarjeta QR reseñas — Auto Escuela Americana")
    c.setFillColor(white)
    c.rect(0, 0, ancho_pag, alto_pag, stroke=0, fill=1)
    dibujar_tarjeta(c, margen, margen, qr, logo, lado_qr, lado_logo)
    c.showPage()
    c.save()
    return salida, logo is not None


def generar(salida: str, filas: int, columnas: int, paginas: int, url: str,
            ruta_logo: str, lado_qr: float, lado_logo: float) -> tuple:
    ancho_pag, alto_pag = letter
    # Sin separación, las cuñas de color de tarjetas vecinas se tocan y la hoja
    # se ve como un mosaico en vez de tarjetas sueltas.
    canal = 3 * mm
    usado_x = columnas * ANCHO_TARJETA + (columnas - 1) * canal
    usado_y = filas * ALTO_TARJETA + (filas - 1) * canal

    if usado_x > ancho_pag or usado_y > alto_pag:
        raise SystemExit(
            f"No caben {columnas}x{filas} tarjetas en carta: necesita "
            f"{usado_x/mm:.0f}x{usado_y/mm:.0f} mm y la hoja es "
            f"{ancho_pag/mm:.0f}x{alto_pag/mm:.0f} mm."
        )

    margen_x = (ancho_pag - usado_x) / 2
    margen_y = (alto_pag - usado_y) / 2

    qr = imagen_qr(url)
    logo = imagen_logo(ruta_logo)

    c = canvas.Canvas(salida, pagesize=letter)
    c.setTitle("Tarjetas QR reseñas — Auto Escuela Americana")

    for _ in range(paginas):
        c.setFillColor(white)
        c.rect(0, 0, ancho_pag, alto_pag, stroke=0, fill=1)
        for fila in range(filas):
            for col in range(columnas):
                px = margen_x + col * (ANCHO_TARJETA + canal)
                py = margen_y + (filas - 1 - fila) * (ALTO_TARJETA + canal)
                dibujar_tarjeta(c, px, py, qr, logo, lado_qr, lado_logo)
        c.showPage()

    c.save()
    return salida, logo is not None


def main() -> None:
    p = argparse.ArgumentParser(description="Tarjetas QR para reseñas de Google")
    p.add_argument("--salida", default="tarjetas_qr_resenas.pdf", help="archivo PDF de salida")
    p.add_argument("--url", default=URL_RESENA, help="URL que codifica el QR")
    p.add_argument("--logo", default=LOGO, help="PNG del logo")
    p.add_argument("--filas", type=int, default=3, help="tarjetas por columna")
    p.add_argument("--columnas", type=int, default=3, help="tarjetas por fila")
    p.add_argument("--paginas", type=int, default=1, help="páginas a generar")
    p.add_argument("--qr", type=float, default=26.0, help="lado del QR en mm")
    p.add_argument("--logo-tam", type=float, default=18.0, dest="logo_tam", help="lado del logo en mm")
    p.add_argument("--individual", action="store_true",
                   help="una sola tarjeta, en una página de su propio tamaño")
    args = p.parse_args()

    if args.individual:
        salida = args.salida
        if salida == p.get_default("salida"):
            salida = "tarjeta_qr_individual.pdf"
        ruta, con_logo = generar_individual(salida, args.url, args.logo, args.qr * mm, args.logo_tam * mm)
        print(f"OK: {ruta} — 1 tarjeta de {ANCHO_TARJETA/mm:.0f}x{ALTO_TARJETA/mm:.0f} mm, QR de {args.qr:.0f} mm, logo de {args.logo_tam:.0f} mm")
        print(f"QR apunta a: {args.url}")
        print(f"Logo: {args.logo}" if con_logo else f"AVISO: no se encontró el logo en '{args.logo}'.")
        return

    ruta, con_logo = generar(args.salida, args.filas, args.columnas,
                             args.paginas, args.url, args.logo, args.qr * mm, args.logo_tam * mm)
    total = args.filas * args.columnas * args.paginas
    print(f"OK: {ruta} — {total} tarjetas ({args.columnas}x{args.filas} por hoja, {args.paginas} hoja(s))")
    print(f"QR apunta a: {args.url}")
    if con_logo:
        print(f"Logo: {args.logo}")
    else:
        print(f"AVISO: no se encontró el logo en '{args.logo}' — se usó el nombre en texto.")


if __name__ == "__main__":
    main()
