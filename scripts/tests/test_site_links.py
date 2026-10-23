import json
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'check-site-links.py'
CHECKER = runpy.run_path(str(SCRIPT))


class SiteLinksTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)

    def write(self, name, content=''):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        return path

    def audit(self):
        return CHECKER['audit'](self.root)

    def test_file_directory_and_extensionless_routes_with_fragments(self):
        self.write('index.html', '<a href="/guide?ref=home#one">Guide</a><a href="/blog/#two">Blog</a><a href="https://theoffgridworkshop.com/space%20name.html#three">Space</a>')
        self.write('guide.html', '<h2 id="one">One</h2>')
        self.write('blog/index.html', '<h2 id="two">Two</h2>')
        self.write('space name.html', '<h2 id="three">Three</h2>')
        self.assertEqual(self.audit()['issues'], [])

    def test_missing_links_fragments_and_duplicate_ids_are_errors(self):
        self.write('index.html', '<a href="missing">Missing</a><a href="#absent">Fragment</a><p id="repeat"></p><p id="repeat"></p>')
        self.assertEqual({issue['kind'] for issue in self.audit()['issues']}, {'missing_link', 'missing_fragment', 'duplicate_id'})

    def test_responsive_candidates_are_checked_separately(self):
        self.write('index.html', '<picture><source srcset="small.webp 400w, large.webp 800w"><img src="small.webp" srcset="small.webp, missing.webp 2x"></picture>')
        self.write('small.webp')
        self.write('large.webp')
        report = self.audit()
        self.assertEqual(report['references']['responsive_image'], 4)
        self.assertEqual([issue['url'] for issue in report['issues']], ['missing.webp'])

    def test_data_srcset_urls_do_not_create_spurious_file_references(self):
        self.write('index.html', '<img srcset="data:image/png;base64,abc 1x, real.webp 2x">')
        self.write('real.webp')
        self.assertEqual(self.audit()['issues'], [])

    def test_css_imports_and_assets_follow_stylesheet_directories(self):
        self.write('index.html', '<link rel="stylesheet" href="css/main.css">')
        self.write('css/main.css', '@import/* nested */"nested/more.css"; .hero{background:url(../hero.webp)}')
        self.write('css/nested/more.css', '@import url("../main.css"); .icon{background:url(../../missing.svg)}')
        self.write('hero.webp')
        report = self.audit()
        self.assertEqual(report['stylesheets'], 2)
        self.assertEqual([(issue['source'], issue['url']) for issue in report['issues']], [('css/nested/more.css', '../../missing.svg')])

    def test_css_comments_plain_strings_data_urls_and_escapes(self):
        self.write('index.html', '<link rel="stylesheet" href="style.css">')
        self.write('style.css', r'''/* url(missing.png) */ .a{content:"url(not-a-reference.png)";background:url("real\20 image.png")} .b{background:url(data:image/png;base64,abc)}''')
        self.write('real image.png')
        self.assertEqual(self.audit()['issues'], [])

    def test_inline_css_references_and_media_assets_are_checked(self):
        self.write('index.html', '<style>.a{background:url(image.webp)}</style><p style="background:url(missing.webp)"></p><video poster="poster.webp" src="movie.mp4"><track src="captions.vtt"></video>')
        for name in ('image.webp', 'poster.webp', 'movie.mp4', 'captions.vtt'):
            self.write(name)
        self.assertEqual([issue['url'] for issue in self.audit()['issues']], ['missing.webp'])

    def test_base_href_changes_local_reference_resolution(self):
        self.write('index.html', '<base href="/assets/"><img src="image.webp"><a href="../guide#target">Guide</a>')
        self.write('assets/image.webp')
        self.write('guide.html', '<p id="target">Target</p>')
        self.assertEqual(self.audit()['issues'], [])

    def test_invalid_base_url_is_reported(self):
        self.write('index.html', '<base href="https://[broken"><img src="image.webp">')
        self.assertEqual(self.audit()['issues'][0]['kind'], 'invalid_base')

    def test_empty_checkout_does_not_receive_a_clean_result(self):
        self.assertEqual(self.audit()['issues'][0]['kind'], 'no_pages')

    def test_external_references_are_ignored_without_network(self):
        self.write('index.html', '<a href="https://example.invalid/missing#nope">External</a><img src="//example.invalid/image.webp"><a href="mailto:owner@example.invalid">Email</a>')
        self.assertEqual(self.audit()['issues'], [])

    def test_named_anchors_and_text_fragment_directives(self):
        self.write('index.html', '<a name="old-target"></a><a href="#old-target">Old</a><h2 id="heading">Heading</h2><a href="#heading:~:text=Heading">Text</a><a href="#:~:text=Heading">Text only</a>')
        self.assertEqual(self.audit()['issues'], [])

    def test_private_templates_and_dot_directories_are_excluded(self):
        self.write('index.html')
        for name in ('reviews/_template.html', '_admin/index.html', '.git/hidden.html'):
            self.write(name, '<img src="missing.png">')
        report = self.audit()
        self.assertEqual(report['pages'], 1)
        self.assertEqual(report['issues'], [])

    def test_reference_to_a_symlink_outside_root_is_rejected(self):
        outside = self.root.parent / (self.root.name + '-outside')
        outside.write_text('outside')
        self.addCleanup(outside.unlink)
        (self.root / 'image.webp').symlink_to(outside)
        self.write('index.html', '<img src="image.webp">')
        self.assertEqual(self.audit()['issues'][0]['kind'], 'outside_root')

    def test_cli_fails_for_a_missing_reference_and_leaves_files_unchanged(self):
        self.write('index.html', '<img src="missing.webp">')
        before = {path.relative_to(self.root): path.read_bytes() for path in self.root.rglob('*') if path.is_file()}
        command = [sys.executable, str(SCRIPT), '--root', str(self.root), '--json']
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)['issues'][0]['kind'], 'missing_asset')
        after = {path.relative_to(self.root): path.read_bytes() for path in self.root.rglob('*') if path.is_file()}
        self.assertEqual(before, after)
        self.write('missing.webp')
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
