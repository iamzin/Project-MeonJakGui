# 하치와레가 저녁 골라줄게! (Project-MeonJakGui)

치이카와(먼작귀)의 하치와레가 고민하다가 오늘 저녁 메뉴를 골라주는 작은 웹.
꾹 누르고 있으면 하치와레가 점점 더 고민하다가, 100%가 되면 "펑—!" 하고 메뉴를 외칩니다.

- 순수 HTML / CSS / JS. 빌드 도구, 라이브러리, 서버, 저장소 없음.
- 캐릭터 이미지(대기 · 점프 · 먹기 3포즈)를 CSS로 움직입니다. (숨쉬기 · 갸웃 · 식은땀 · 떨림 · 점프 · 바운스)
- 이미지 없이 쓰려면 `CONFIG.useImages` 를 끄면 직접 그린 인라인 SVG 하치와레로 대체됩니다.
- 카테고리 필터: 전체 · 한식 · 중식 · 일식 · 양식 · 아시안 · 분식·야식 · 가볍게
- 결과는 URL 해시(`#r=…`)에만 담겨 공유됩니다. 쿠키 · 서버 · 브라우저 저장소를 쓰지 않습니다.

## 로컬에서 보기

```bash
python3 -m http.server 8765
# http://localhost:8765
```

## 구조

```
index.html             페이지 + 인라인 SVG 하치와레
css/style.css          색상 · 레이아웃 · 캐릭터/연출 애니메이션
js/menus.js            메뉴 목록 (여기만 고치면 메뉴 추가/수정)
js/app.js              꾹 누르기 게이지 · 상태 전환 · 결과 · 공유 링크 (CONFIG 로 조절)
assets/character/      캐릭터 포즈 이미지 idle · happy · eat (README 참고)
assets/social/og.png   링크 미리보기 이미지 (1200×630)
assets/effects/        파비콘 · 흔들림 효과선
vercel.json            정적 배포 설정 (캐시 · 보안 헤더)
```

## Vercel 배포

1. https://vercel.com/new 에서 GitHub 리포 `Project-MeonJakGui` 를 Import.
2. 설정은 전부 기본값 그대로 두면 됩니다.
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: 비움 / Output Directory: 비움 / Install Command: 비움
   - 환경 변수: 없음
3. Deploy. 이후 `main` 브랜치에 푸시할 때마다 자동 배포됩니다.
4. 배포 주소가 `https://project-meonjakgui.vercel.app` 이 아니면 `index.html` 의 `og:image` / `twitter:image` URL을 실제 주소로 바꿔 주세요.

## 캐릭터 이미지 교체

`assets/character/README.md` 를 참고하세요. 정지 이미지만 있으면 움직임은 CSS가 처리합니다.

## 저작권

치이카와 © nagano / ちいかわ製作委員会. 이 프로젝트는 비영리 팬 메이드입니다. 캐릭터 이미지의 권리는 원저작자에게 있습니다.
글꼴: [Galmuri](https://galmuri.quiple.dev) (SIL OFL).
