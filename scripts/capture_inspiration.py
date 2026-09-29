#!/usr/bin/env python3
"""Archive original public Pinterest media for the existing library. No login bypass.
Requires Pillow, ffmpeg and ffprobe. Failures remain explicit in capture-report.json.
Run from any directory: python scripts/capture_inspiration.py
"""
import datetime
import hashlib
import html
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / 'inspiration/library.json'
OUTPUT = ROOT / 'react-configurator/public/inspiration-media'
MAX_BYTES = 50 * 1024 * 1024


def allowed(url, media=False):
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname or ''
    suffix = 'pinimg.com' if media else 'pinterest.com'
    if parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port not in (None, 443) or not (host == suffix or host.endswith('.' + suffix)):
        raise ValueError('Unexpected source host; refusing to download')
    return url


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        allowed(newurl, 'pinimg.com' in urllib.parse.urlsplit(req.full_url).hostname)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def download(url, media=False):
    allowed(url, media)
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; HomeInspirationArchive/1.0)', 'Accept-Language': 'en-US,en;q=0.9'})
    with urllib.request.build_opener(SafeRedirect()).open(request, timeout=35) as response:
        allowed(response.url, media)
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError('Source exceeds the 50 MiB download limit')
        return data


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.scripts, self.script, self.canonical = {}, [], None, ''

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.meta[attrs.get('property', attrs.get('name', ''))] = attrs.get('content', '')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href', '')
        if tag == 'script':
            self.script = []

    def handle_data(self, data):
        if self.script is not None:
            self.script.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(''.join(self.script))
            self.script = None


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def source_media(page, pin):
    records = []
    for script in page.scripts:
        try:
            records += [record for record in walk(json.loads(script)) if str(record.get('id', '')) == pin]
        except (ValueError, RecursionError):
            pass
    images, videos = [], []
    for record in records:
        for node in walk(record):
            sizes = node.get('images')
            if isinstance(sizes, dict):
                for key in ('orig', 'originals', '736x', '564x', '474x'):
                    value = sizes.get(key)
                    if isinstance(value, dict) and value.get('url'):
                        images.append(value['url'])
                        break
            streams = node.get('video_list')
            if isinstance(streams, dict):
                options = [v for v in streams.values() if isinstance(v, dict) and str(v.get('url', '')).split('?')[0].endswith('.mp4')]
                options.sort(key=lambda v: v.get('width', 0), reverse=True)
                if options:
                    videos.append(options[0]['url'])
    # OpenGraph is accepted only when the page identifies the exact requested pin.
    canonical = page.canonical or page.meta.get('og:url', '')
    if re.search(r'/pin/' + re.escape(pin) + r'/?(?:[?#]|$)', canonical):
        if page.meta.get('og:image'):
            images.insert(0, page.meta['og:image'])
        video = page.meta.get('og:video', page.meta.get('og:video:url', ''))
        if video.split('?')[0].endswith('.mp4'):
            videos.insert(0, video)
    def clean(values):
        result = []
        for url in values:
            try:
                allowed(url, True)
                if url not in result:
                    result.append(url)
            except ValueError:
                pass
        return result
    return clean(images)[:4], clean(videos)[:1]


def save_image(raw, pin, label):
    from PIL import Image, ImageOps
    with Image.open(io.BytesIO(raw)) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        image.thumbnail((1600, 1600))
        buffer = io.BytesIO()
        image.save(buffer, 'WEBP', quality=88)
    contents = buffer.getvalue()
    digest = hashlib.sha256(contents).hexdigest()[:16]
    filename = f'{pin}-{label}-{digest}.webp'
    (OUTPUT / filename).write_bytes(contents)
    return {'id': f'pin-{pin}-{label}-{digest}', 'src': '/inspiration-media/' + filename}


def capture(item, stamp):
    pin = re.fullmatch(r'/pin/(\d+)/?', urllib.parse.urlsplit(item['url']).path)
    if not pin:
        raise ValueError('Not a canonical Pinterest pin URL; no media guessed')
    pin = pin[1]
    allowed(item['url'])
    page = Page()
    page.feed(download(item['url']).decode('utf-8', errors='replace'))
    images, videos = source_media(page, pin)
    photos, warnings = [], []
    for index, url in enumerate(images):
        try:
            photo = save_image(download(url, True), pin, f'image-{index + 1}')
            photo.update(caption='Original Pinterest image / video poster', kind='image', sourceUrl=item['url'], sourceMediaUrl=url, capturedAt=stamp)
            photos.append(photo)
        except Exception as error:
            warnings.append(f'Image {index + 1}: {error}')
    for url in videos:
        try:
            with tempfile.TemporaryDirectory() as folder:
                video = Path(folder) / 'original.mp4'
                video.write_bytes(download(url, True))
                duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(video)], timeout=30))
                if not 0 < duration < 3600:
                    raise ValueError('Invalid or excessive video duration')
                for index, fraction in enumerate((0.1, 0.5, 0.9)):
                    seconds = round(duration * fraction, 2)
                    frame = Path(folder) / f'frame-{index}.png'
                    subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(seconds), '-i', str(video), '-frames:v', '1', '-y', str(frame)], check=True, timeout=60)
                    photo = save_image(frame.read_bytes(), pin, f'frame-{index + 1}')
                    photo.update(caption=f'Original video — frame at {seconds:g} seconds', kind='video-frame', sourceUrl=item['url'], sourceMediaUrl=url, capturedAt=stamp, timeSeconds=seconds)
                    photos.append(photo)
        except Exception as error:
            warnings.append(f'Video: {error}')
    if not photos:
        raise ValueError('; '.join(warnings) or 'No original pin media accessible; page may require sign-in. Nothing substituted.')
    return photos, warnings


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    library = json.loads(LIBRARY.read_text(encoding='utf-8'))
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report = {'capturedAt': stamp, 'policy': 'Original public pin media only. No sign-in bypass, related-pin substitution or generated images.', 'items': []}
    for item in library['items']:
        result = {'id': item['id'], 'url': item['url']}
        try:
            photos, warnings = capture(item, stamp)
            existing = item.get('photos', [])
            known = {photo['src'] for photo in existing}
            item['photos'] = (existing + [photo for photo in photos if photo['src'] not in known])[:12]
            result.update(status='captured', count=len(photos), warnings=warnings)
        except Exception as error:
            result.update(status='unavailable', reason=str(error))
        report['items'].append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)
    LIBRARY.write_text(json.dumps(library, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    (ROOT / 'inspiration/capture-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
