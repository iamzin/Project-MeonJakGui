# 캐릭터 이미지 슬롯

기본값은 `index.html` 안에 직접 그린 인라인 SVG 하치와레를 CSS로 움직입니다.
직접 구한 이미지로 바꾸려면:

1. 아래 파일을 이 폴더에 넣습니다 (투명 배경 WebP/PNG, 권장 640×680).
   - `idle.webp`    가만히 서 있는 모습
   - `think.webp`   고개 갸웃, 고민하는 모습
   - `tremble.webp` 식은땀 흘리며 떨고 있는 모습
   - `happy.webp`   팔 번쩍 들고 기뻐하는 모습
2. `js/app.js` 의 `CONFIG.useImages` 를 `true` 로 바꿉니다.

흔들림·점프·바운스 같은 움직임은 CSS가 그대로 적용되므로 정지 이미지만 있으면 됩니다.
