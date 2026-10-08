#!/usr/bin/env python3
"""Assembles the static pages from templates/*.html fragments with a shared header & footer.
Run: python3 scripts/build.py   (writes index.html, ar/index.html, publications.html, ...)"""
import os, re, json, datetime, time
STAMP = str(int(time.time()))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, 'templates')

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet">'

NAV = {
 'en': [('index.html#arenas','What I do'),('research.html','Research'),('publications.html','Publications'),('students.html','Students & Teaching'),('index.html#work','Work'),('index.html#insights','Insights'),('index.html#contact','Contact')],
 'ar': [('index.html#arenas','ماذا أعمل'),('research.html','البحث'),('publications.html','المنشورات'),('students.html','الطلاب والتدريس'),('index.html#work','الأعمال'),('index.html#insights','مقالات'),('index.html#contact','تواصل')],
}

def head(lang, title, desc, base, alt):
    dir_ = 'rtl' if lang == 'ar' else 'ltr'
    return f'''<!doctype html>
<html lang="{lang}" dir="{dir_}" data-base="{base}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="profile"><meta property="og:image" content="https://waealobidallah.github.io/assets/img/waeal.jpg">
<link rel="alternate" hreflang="{'en' if lang=='ar' else 'ar'}" href="{alt}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%278%27 fill=%27%230B1F3A%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%277%27 fill=%27%230E7C72%27/%3E%3C/svg%3E">
{FONTS}
<link rel="stylesheet" href="{base}assets/css/site.css?v={STAMP}">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Person","name":"Waeal J. Obidallah","honorificPrefix":"Dr.","jobTitle":["Associate Professor of Information Systems","Consultant, SDAIA"],"affiliation":[{{"@type":"Organization","name":"Imam Mohammad Ibn Saud Islamic University"}},{{"@type":"Organization","name":"Saudi Data and AI Authority (SDAIA)"}}],"alumniOf":"University of Ottawa","url":"https://waealobidallah.github.io/","sameAs":["https://orcid.org/0000-0002-5086-3950","https://www.linkedin.com/in/waealobidallah/","https://x.com/waealo","https://scholar.google.com/citations?user=waealobidallah"],"email":"mailto:waealobidallah@gmail.com"}}</script>
</head>
<body>'''

def nav(lang, base, alt):
    pre = '' if lang == 'ar' else base   # Arabic pages all live in /ar/
    items = ''.join(f'<li><a href="{pre}{h}">{t}</a></li>' for h, t in NAV[lang])
    langlink = f'<li><a class="lang" href="{alt}">{"English" if lang=="ar" else "العربية"}</a></li>'
    name = 'وائل عبيدالله' if lang == 'ar' else 'Waeal J. Obidallah'
    return f'''<header class="nav"><div class="wrap"><a class="brand" href="{'' if lang=='ar' else base}index.html"><span class="dot"></span>{name}</a>
<nav><ul class="menu">{items}{langlink}<li><button class="theme" aria-label="Toggle dark mode">☾</button></li></ul></nav><button class="burger" aria-label="Menu">☰</button></div></header>'''

def foot(lang, base):
    if lang == 'ar':
        t = f'<div>© <span data-year>2026</span> د. وائل جمعة عبيدالله · آخر تحديث {datetime.date.today():%B %Y}</div>'
    else:
        t = f'<div>© <span data-year>2026</span> Waeal J. Obidallah · Last updated {datetime.date.today():%B %Y}</div>'
    links = '<div><a href="https://scholar.google.com/citations?user=waealobidallah" target="_blank" rel="noopener">Google Scholar</a> · <a href="https://www.linkedin.com/in/waealobidallah/" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://orcid.org/0000-0002-5086-3950" target="_blank" rel="noopener">ORCID</a> · <a href="https://x.com/waealo" target="_blank" rel="noopener">X</a></div>'
    return f'<footer><div class="wrap">{t}{links}</div></footer><script src="{base}assets/js/site.js?v={STAMP}"></script></body></html>'

def build(src, out, lang, title, desc, base, alt):
    body = open(os.path.join(T, src), encoding='utf-8').read()
    html = head(lang, title, desc, base, alt) + nav(lang, base, alt) + body + foot(lang, base)
    p = os.path.join(ROOT, out); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(html); print('wrote', out, len(html))

PAGES = [
 ('home-en.html','index.html','en','Waeal J. Obidallah — AI capability, innovation & research','Associate Professor of Information Systems and SDAIA consultant. Led Saudi Arabia’s national AI capability-building strategy and ICAN 2026; 30 peer-reviewed journal articles; PhD, University of Ottawa.','','ar/index.html'),
 ('publications-en.html','publications.html','en','Publications — Waeal J. Obidallah','30 journal articles and 9 conference papers on AI in healthcare and industry, IoT security, blockchain adoption and web-services discovery.','','ar/publications.html'),
 ('students-en.html','students.html','en','Students & Teaching — Waeal J. Obidallah','MSc supervision, graduation projects, 13 courses and academic service at IMSIU.','','ar/students.html'),
 ('research-en.html','research.html','en','Research — Waeal J. Obidallah','Research interests, open MSc thesis topics, projects and grants.','','ar/research.html'),
 ('badges-en.html','work/ai-badges.html','en','Case study: National AI Badges — Waeal J. Obidallah','How a national AI badging system went from concept to first exam in under a year.','../','../ar/index.html#work'),
 ('home-ar.html','ar/index.html','ar','د. وائل عبيدالله — بناء القدرات في الذكاء الاصطناعي، الابتكار والبحث','أستاذ مشارك في نظم المعلومات ومستشار في سدايا. قاد الاستراتيجية الوطنية لبناء القدرات في الذكاء الاصطناعي ومؤتمر ICAN 2026؛ 30 ورقة علمية محكمة؛ دكتوراه من جامعة أوتاوا.','../','../index.html'),
 ('publications-ar.html','ar/publications.html','ar','المنشورات — د. وائل عبيدالله','30 ورقة في مجلات محكمة و9 أوراق مؤتمرات.','../','../publications.html'),
 ('students-ar.html','ar/students.html','ar','الطلاب والتدريس — د. وائل عبيدالله','الإشراف على رسائل الماجستير، مشاريع التخرج، 13 مقررًا والخدمة الأكاديمية.','../','../students.html'),
 ('research-ar.html','ar/research.html','ar','البحث — د. وائل عبيدالله','الاهتمامات البحثية، مواضيع رسائل الماجستير المتاحة، المشاريع والمنح.','../','../research.html'),
]
if __name__ == '__main__':
    for p in PAGES:
        if os.path.exists(os.path.join(T, p[0])): build(*p)
        else: print('skip (no template):', p[0])
