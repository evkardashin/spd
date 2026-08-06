#!/usr/bin/env python3
"""Build clean local pages from the current formfactor.ru documents."""

from __future__ import annotations

import html
import re
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://formfactor.ru"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 Chrome/131 Safari/537.36"
}

PAGES = {
    "privacy": (
        "Политика обработки персональных данных",
        "документы / конфиденциальность",
        "Правила обработки и защиты персональных данных пользователей Formfactor.",
    ),
    "oferta": (
        "Публичная оферта",
        "документы / обучение",
        "Условия оказания платных образовательных услуг по продуктовому дизайну.",
    ),
    "oferta-sub": (
        "Оферта подписки",
        "документы / подписка",
        "Условия регулярного доступа к материалам и закрытому Telegram-каналу.",
    ),
    "svedeniya": (
        "Сведения об образовательной организации",
        "открытая информация",
        "Документы, реквизиты и обязательные сведения об образовательной деятельности.",
    ),
}

LOCAL_LINKS = {
    "/": "../index.html",
    "/privacy": "../privacy/",
    "/oferta": "../oferta/",
    "/oferta-sub": "../oferta-sub/",
    "/svedeniya": "../svedeniya/",
    "/contacts": "../contacts/",
    "/uznai-grade": "../uznai-grade/",
    "/anketa": "../anketa/Анкета.html",
}


def page_head(title: str) -> str:
    safe_title = html.escape(title)
    return f'''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{safe_title} — Formfactor</title>
  <meta name="description" content="{safe_title}">
  <link rel="stylesheet" href="../css/normalize.css">
  <link rel="stylesheet" href="../css/webflow.css">
  <link rel="stylesheet" href="../css/fff-9072af.webflow.css">
  <link rel="stylesheet" href="../css/internal-pages.css">
  <link rel="icon" href="../images/favicon.ico" type="image/x-icon" media="(prefers-color-scheme: light)">
  <link rel="icon" href="../images/favicon-dark.ico" type="image/x-icon" media="(prefers-color-scheme: dark)">
  <link rel="apple-touch-icon" href="../images/webclip.png">
  <script>document.documentElement.classList.add('has-js');</script>
  <style>
    html {{ font-size: 1rem; }}
    @media screen and (max-width: 1920px) {{ html {{ font-size: .83333333vw; }} }}
    @media screen and (max-width: 479px) {{ html {{ font-size: calc(.0012019230769234612rem + 4.26153846153846vw); }} }}
  </style>
</head>'''

def navigation() -> str:
    return '''
<div class="scroll_progress" aria-hidden="true"><div class="scroll_progress_bar"></div></div>
<div role="banner" class="navbar w-nav">
  <div class="nav_container">
    <a href="../index.html" class="logo w-nav-brand">
      <div class="logo_text">фф</div>
      <div class="logo_text display-none">Школа продуктового дизайна</div>
    </a>
    <nav role="navigation" class="nav-menu w-nav-menu">
      <div class="nav_btn_left">
        <a href="../index.html#program" class="nav_btn w-inline-block"><div class="nav_text_btn">программа</div></a>
        <a href="../index.html#mentor" class="nav_btn w-inline-block"><div class="nav_text_btn">менторы</div></a>
        <a href="../index.html#workshop" class="nav_btn w-inline-block"><div class="nav_text_btn">вокршопы</div></a>
        <a href="../index.html#case" class="nav_btn w-inline-block"><div class="nav_text_btn">работы учеников</div></a>
      </div>
      <div class="nav_btn_right">
        <a href="#" class="nav_btn_pink_menu w-inline-block" data-popup-open="popup-nav-mob"><div class="nav_text_btn white">менюшка</div></a>
        <a href="../uznai-grade/" class="nav_btn_pink display-none w-inline-block"><div class="nav_text_btn white">тест на грейдик</div></a>
        <a href="../anketa/Анкета.html" class="nav_btn backdrop-none w-inline-block"><div class="nav_text_btn">записаться на ассессмент</div></a>
      </div>
    </nav>
  </div>
</div>
<div id="popup-nav-mob" class="popup_nav_mob" data-popup-animate="slide-up" data-popup-slide-from="top">
  <div class="container">
    <div class="popup_content_mob_wrapper">
      <div class="popup_mob_bg">
        <a href="../index.html#program" class="text_nav_mob w-inline-block">программа</a>
        <a href="../index.html#mentor" class="text_nav_mob w-inline-block">менторы</a>
        <a href="../index.html#workshop" class="text_nav_mob w-inline-block">вокршопы</a>
        <a href="../index.html#case" class="text_nav_mob width-230 w-inline-block">работы учеников</a>
        <a href="#" class="nav_btn_pink_close w-inline-block" data-popup-close><div class="nav_text_btn white">закрываем</div></a>
        <a href="../index.html" class="logo-copy w-nav-brand">
          <div class="logo_text">фф</div><div class="logo_text display-none">Школа продуктового дизайна</div>
        </a>
      </div>
      <div class="popup_line-copy"></div>
    </div>
  </div>
</div>'''

def footer() -> str:
    return '''
<div class="footer">
  <div class="container">
    <div class="footer_padding">
      <div class="footer_content_wrapper">
        <div class="footer_content_top mb-240" data-footer-el="top">
          <div class="footer_text">© formfactor 2023–2052<br></div>
          <div class="footer_link_wrapper">
            <a href="../oferta/" class="footer_link">публичная оферта</a>
            <a href="../svedeniya/" class="footer_link">сведения об обр. организации</a>
            <a href="../oferta-sub/" class="footer_link">оферта подписки</a>
            <a href="../privacy/" class="footer_link">политика конфиденциальности</a>
            <a href="../contacts/" class="footer_link">контакты</a>
          </div>
        </div>
        <div class="school_img_wrapper mb-17" data-footer-el="title"><img src="../images/school.svg" loading="lazy" alt=""></div>
        <div class="footer_btn_wrapper mb-108" data-footer-el="cta">
          <a href="#" class="btn_main w-inline-block"><div class="btn_main_text">скачать программу</div></a>
        </div>
        <div class="footer_content_bot" data-footer-el="bottom">
          <div class="footer_text">обр. лицензия № Л035-01265-18/02025868</div>
          <div class="footer_text">представь, дизайн&nbsp;— это&nbsp;грядка. я&nbsp;прохожу с&nbsp;нею&nbsp;рядом.<br>я&nbsp;поливаю как&nbsp;надо, ты&nbsp;знаешь формулу этого&nbsp;яда</div>
        </div>
        <div class="nemo_img_wrapper" data-footer-el="decor"><img src="../images/nemo.avif" loading="lazy" alt="" class="image-3"></div>
        <div class="ezh_img_wrapper" data-footer-el="decor"><img src="../images/ezh.avif" loading="lazy" sizes="100vw" srcset="../images/ezh-p-500.avif 500w, ../images/ezh-p-800.avif 800w, ../images/ezh.avif 845w" alt="" class="image-3"></div>
        <div class="chaynik_img_wrapper" data-footer-el="decor"><img src="../images/chaynik.png" loading="lazy" alt="" class="image-3"></div>
        <div class="rabbit_img_wrapper" data-footer-el="decor"><img src="../images/rabbit.avif" loading="lazy" sizes="100vw" srcset="../images/rabbit-p-500.avif 500w, ../images/rabbit.avif 602w" alt="" class="image-3"></div>
        <div class="stop_img_wrapper" data-footer-el="decor"><img src="../images/stop.avif" loading="lazy" alt="" class="image-3"></div>
      </div>
    </div>
  </div>
</div>
<div class="footer_mob">
  <div class="container">
    <div class="footer_mob_padding">
      <div class="footer_mob_content_wrapper">
        <div class="footer_mob_btn_wrapper" data-footer-el="cta">
          <a href="#" class="btn_main w-inline-block"><div class="btn_main_text">скачать программу</div></a>
        </div>
        <div class="footer_mob_content_top" data-footer-el="top">
          <div class="footer_text">© formfactor <br>2023–2052</div>
          <div class="footer_text witdth-162">обр. лицензия № Л035-01265-18/02025868</div>
        </div>
        <div class="footer_mob_img_wrapper" data-footer-el="title"><img src="../images/text.svg" loading="lazy" alt="" class="image-3"></div>
        <div class="footer_mob_content_bot" data-footer-el="bottom">
          <div class="footer_mob_text_wrapper"><div class="footer_text width-282 text_align_center">представь, дизайн — это грядка. я прохожу<br>c нею рядом. я поливаю как надо, ты знаешь формулу этого яда<br></div></div>
          <div class="footer_mob_link_wrapper">
            <div class="footer_link_left_side">
              <a href="../privacy/" class="footer_link">политика конфиденциальности</a>
              <a href="../oferta-sub/" class="footer_link">оферта подписки</a>
              <a href="../contacts/" class="footer_link">контакты</a>
            </div>
            <div class="footer_link_right_side">
              <a href="../svedeniya/" class="footer_link text_align_right">сведения об обр. организации</a>
              <a href="../oferta/" class="footer_link">публичная оферта</a>
            </div>
          </div>
        </div>
        <div class="nemo_img_wrapper" data-footer-el="decor"><img src="../images/nemo.avif" loading="lazy" alt="" class="image-3"></div>
        <div class="ezh_img_wrapper" data-footer-el="decor"><img src="../images/ezh.avif" loading="lazy" sizes="100vw" srcset="../images/ezh-p-500.avif 500w, ../images/ezh-p-800.avif 800w, ../images/ezh.avif 845w" alt="" class="image-3"></div>
        <div class="chaynik_img_wrapper" data-footer-el="decor"><img src="../images/chaynik.png" loading="lazy" alt="" class="image-3"></div>
        <div class="stop_img_wrapper" data-footer-el="decor"><img src="../images/stop.avif" loading="lazy" alt="" class="image-3"></div>
        <div class="rabbit_img_wrapper" data-footer-el="decor"><img src="../images/rabbit.avif" loading="lazy" sizes="100vw" srcset="../images/rabbit-p-500.avif 500w, ../images/rabbit.avif 602w" alt="" class="image-3"></div>
      </div>
    </div>
  </div>
</div>
<script src="../js/internal-pages.js"></script>
<script src="../js/gsap.min.js"></script>
<script src="../js/interactions.js"></script>
<script src="../js/footer-animation.js"></script>'''


def rewrite_href(href: str) -> str:
    if not href:
        return "#"
    parsed = urlparse(href)
    if parsed.netloc in {"formfactor.ru", "www.formfactor.ru"}:
        local = LOCAL_LINKS.get(parsed.path.rstrip("/") or "/")
        if local:
            return local + (("#" + parsed.fragment) if parsed.fragment else "")
    return href


def sanitize_fragment(candidate: Tag) -> str:
    fragment = BeautifulSoup("".join(str(node) for node in candidate.contents), "html.parser")
    for node in fragment.select("script, style, noscript, svg, iframe, form, button"):
        node.decompose()
    allowed = {"p", "br", "strong", "em", "u", "a", "ul", "ol", "li"}
    for node in list(fragment.find_all(True)):
        if node.name not in allowed:
            node.unwrap()
            continue
        href = node.get("href") if node.name == "a" else None
        node.attrs = {}
        if node.name == "a" and href:
            rewritten = rewrite_href(href)
            node["href"] = rewritten
            if rewritten.startswith(("http://", "https://")):
                node["target"] = "_blank"
                node["rel"] = "noopener"
    for strong in fragment.find_all("strong"):
        label = " ".join(strong.get_text(" ", strip=True).split())
        if len(label) <= 150 and (re.match(r"^\d+[.\s]", label) or label.isupper()):
            strong["class"] = "legal-subheading"
    return str(fragment).strip()


def split_candidate(candidate: Tag) -> list[Tag]:
    chunks: list[Tag] = []
    current = BeautifulSoup("<div></div>", "html.parser").div
    for node in list(candidate.contents):
        text = " ".join(node.get_text(" ", strip=True).split()) if isinstance(node, Tag) else str(node).strip()
        strong = node.find("strong") if isinstance(node, Tag) else None
        strong_text = " ".join(strong.get_text(" ", strip=True).split()) if strong else ""
        is_marker = bool(re.match(r"^\d+[.]\s*", strong_text or text))
        if is_marker and current.get_text(" ", strip=True):
            chunks.append(current)
            current = BeautifulSoup("<div></div>", "html.parser").div
        current.append(BeautifulSoup(str(node), "html.parser"))
    if current.get_text(" ", strip=True):
        chunks.append(current)
    return chunks or [candidate]


def title_from_fragment(fragment: str, fallback: str) -> str:
    soup = BeautifulSoup(fragment, "html.parser")
    # Always preserve source order. A later numbered subheading must not replace
    # an earlier appendix/document heading merely because it has a CSS class.
    strong = soup.find("strong")
    value = " ".join((strong.get_text(" ", strip=True) if strong else fallback).split())
    if len(value) > 110:
        value = fallback
    return value.rstrip(":")


def normalized_heading(value: str) -> str:
    return re.sub(r"[^0-9a-zа-яё]+", "", value.casefold())


def remove_repeated_card_heading(body: str, card_title: str) -> str:
    """The card's h2 already represents its source heading; remove its duplicate in the body."""
    soup = BeautifulSoup(body, "html.parser")
    target = normalized_heading(card_title)
    for strong in list(soup.find_all("strong")):
        if normalized_heading(strong.get_text(" ", strip=True)) != target:
            continue
        parent = strong.parent
        if parent and parent.name == "p" and normalized_heading(parent.get_text(" ", strip=True)) == target:
            parent.decompose()
        else:
            strong.decompose()
    return str(soup).strip()


def table_fragment(record: Tag) -> str:
    rows = []
    for row in record.select("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        values = []
        for cell in cells[:2]:
            wrapper = BeautifulSoup("<div></div>", "html.parser").div
            for node in list(cell.contents):
                wrapper.append(BeautifulSoup(str(node), "html.parser"))
            values.append(sanitize_fragment(wrapper))
        rows.append(f"<tr><td>{values[0]}</td><td>{values[1]}</td></tr>")
    return '<table class="info-table"><tbody>' + "".join(rows) + "</tbody></table>"


def extract_cards(slug: str) -> list[tuple[str, str]]:
    response = requests.get(BASE + "/" + slug, headers=HEADERS, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    allrecords = soup.select_one("#t-main-content #allrecords") or soup.select_one("#allrecords")
    if not allrecords:
        raise RuntimeError(f"Не найден контент страницы {slug}")
    cards: list[tuple[str, str]] = []
    source_blocks: list[str] = []
    records = [node for node in allrecords.find_all(recursive=False) if isinstance(node, Tag)]
    for index, record in enumerate(records, 1):
        if record.get("id") in {"t-header", "t-footer"} or record.name in {"header", "footer"}:
            continue
        if "t431" in " ".join(record.get("class", [])) or record.select_one("table"):
            body = table_fragment(record)
            if "<tr>" in body:
                cards.append(("Обязательные сведения", body))
            continue
        candidates = record.select(".t-text")
        if not candidates:
            continue
        candidate = max(candidates, key=lambda item: len(item.get_text(" ", strip=True)))
        if len(candidate.get_text(" ", strip=True)) < 20:
            continue
        if slug == "oferta":
            source_blocks.append(" ".join(candidate.get_text(" ", strip=True).replace("\xa0", " ").split()))
        # The public offer already uses one Tilda record per legal section.
        # Keeping those records intact preserves appendix headers and ordering.
        parts = split_candidate(candidate) if slug in {"privacy", "oferta-sub"} else [candidate]
        for part in parts:
            body = sanitize_fragment(part)
            plain = BeautifulSoup(body, "html.parser").get_text(" ", strip=True)
            if len(plain) < 12:
                continue
            fallback = "Вводная часть" if not cards else f"Раздел {len(cards)}"
            cards.append((title_from_fragment(body, fallback), body))
    if slug in {"privacy", "oferta-sub"} and cards:
        grouped: list[tuple[str, str]] = []
        current_title = cards[0][0] if not cards[0][0].startswith("Раздел ") else "Вводная часть"
        current_bodies: list[str] = []
        for card_title, body in cards:
            is_top_level = bool(re.match(r"^\d+\.(?!\d)\s+", card_title))
            if is_top_level and current_bodies:
                grouped.append((current_title, "\n".join(current_bodies)))
                current_title = card_title
                current_bodies = []
            current_bodies.append(body)
        if current_bodies:
            grouped.append((current_title, "\n".join(current_bodies)))
        cards = grouped
    cards = [(title, remove_repeated_card_heading(body, title)) for title, body in cards]
    if slug == "oferta":
        rendered_blocks = [
            " ".join(
                (title + " " + BeautifulSoup(body, "html.parser").get_text(" ", strip=True))
                .replace("\xa0", " ")
                .split()
            )
            for title, body in cards
        ]
        if source_blocks != rendered_blocks:
            mismatch = next(
                (i for i, pair in enumerate(zip(source_blocks, rendered_blocks), 1) if pair[0] != pair[1]),
                min(len(source_blocks), len(rendered_blocks)) + 1,
            )
            raise RuntimeError(
                f"Текст oferta отличается от оригинала: блок {mismatch}; "
                f"оригинал={len(source_blocks)}, локально={len(rendered_blocks)}"
            )
    if not cards:
        raise RuntimeError(f"Пустая страница {slug}")
    return cards


def document_page(slug: str, meta: tuple[str, str, str], cards: list[tuple[str, str]]) -> str:
    title, kicker, lead = meta
    toc = "".join(
        f'<a class="toc-link" href="#section-{i}">{html.escape(card_title)}</a>'
        for i, (card_title, _) in enumerate(cards, 1)
    )
    content_parts = []
    for i, (card_title, body) in enumerate(cards, 1):
        # The hero already names the document, so do not repeat the same title
        # immediately in the first content card.
        repeated_page_title = i == 1 and normalized_heading(card_title) == normalized_heading(title)
        heading = "" if repeated_page_title else f'  <h2 class="legal-card-title">{html.escape(card_title)}</h2>\n'
        content_parts.append(
            f'''<article class="legal-card" id="section-{i}" data-reveal>
{heading}  {body}
</article>'''
        )
    content = "".join(content_parts)
    return f'''{page_head(title)}
<body class="body">
<div class="page-shell">
{navigation()}
<main>
  <section class="page-hero" data-reveal>
    <div class="page-hero-inner">
      <div class="page-kicker">{html.escape(kicker)}</div>
      <div>
        <h1 class="page-title">{html.escape(title)}</h1>
        <p class="page-lead">{html.escape(lead)}</p>
      </div>
    </div>
  </section>
  <div class="document-layout">
    <aside class="document-toc">
      <h2 class="toc-label">на странице</h2>
      <nav class="toc-list">{toc}</nav>
    </aside>
    <div class="document-content">{content}</div>
  </div>
</main>
{footer()}
</div>
</body>
</html>'''


def grade_page() -> str:
    test_url = "https://ff-bot.com/link/testff?utm_source=fflanding&utm_medium=graid"
    return f'''{page_head("Узнай свой грейд")}
<body class="body grade-page">
<div class="page-shell">
{navigation()}
<main>
  <section class="page-hero grade-hero" data-reveal>
    <div class="page-hero-inner">
      <div class="grade-heading">
        <div class="page-kicker">бесплатный тест навыков</div>
        <h1 class="page-title">узнай свой грейд</h1>
      </div>
      <div class="grade-art-stage">
        <picture class="grade-scale">
          <source media="(max-width: 900px)" srcset="../images/grade-scale-horizontal.png">
          <img src="../images/grade-scale-vertical.png" alt="Шкала грейдов: intern, junior, junior+, middle, middle+ и senior">
        </picture>
        <img class="grade-art" src="../images/grade-flower.png" alt="Навыки продуктового дизайнера: аналитика, процессы, дизайн и исследования">
      </div>
      <p class="grade-description">Пройди тест — узнай свой грейд и уровень навыков продуктового дизайнера.</p>
    </div>
  </section>
  <section class="grade-test-cta" data-reveal>
    <div class="grade-test-cta-inner">
      <a href="{test_url}" target="_blank" rel="noopener">пройти тест →</a>
    </div>
  </section>
</main>
{footer()}
</div>
</body>
</html>'''


def contacts_page() -> str:
    return f'''{page_head("Контакты")}
<body class="body">
<div class="page-shell">
{navigation()}
<main>
  <section class="page-hero" data-reveal>
    <div class="page-hero-inner">
      <div class="page-kicker">давайте знакомиться</div>
      <div><h1 class="page-title">контакты</h1><p class="page-lead">Задайте вопрос о программе, обучении или документах — ответим по делу.</p></div>
    </div>
  </section>
  <section class="contact-grid">
    <article class="contact-card" data-reveal>
      <h2>Напишите нам</h2>
      <a class="contact-link" href="mailto:arturkuzmin1@gmail.com">arturkuzmin1@gmail.com</a>
    </article>
    <article class="contact-card" data-reveal>
      <h2>Поступление</h2>
      <div><p>Хотите разобраться, подходит ли вам программа?</p><a class="primary-button" href="../anketa/Анкета.html">оставить заявку →</a></div>
    </article>
  </section>
</main>
{footer()}
</div>
</body>
</html>'''


def main() -> None:
    for slug, meta in PAGES.items():
        target = ROOT / slug
        target.mkdir(exist_ok=True)
        cards = extract_cards(slug)
        (target / "index.html").write_text(document_page(slug, meta, cards), encoding="utf-8")
        print(f"{slug}: {len(cards)} content blocks")

    grade_target = ROOT / "uznai-grade"
    grade_target.mkdir(exist_ok=True)
    (grade_target / "index.html").write_text(grade_page(), encoding="utf-8")

    contacts_target = ROOT / "contacts"
    contacts_target.mkdir(exist_ok=True)
    (contacts_target / "index.html").write_text(contacts_page(), encoding="utf-8")
    print("uznai-grade and contacts: built")


if __name__ == "__main__":
    main()
