# 홀덤 분배기 (Hold'em Dealer)

Express + Socket.io로 만든 실시간 홀덤 카드 분배기입니다. 호스트가 방을 만들고,
플레이어 두 명이 방 코드로 접속해 모바일로 함께 플레이합니다.

## 로컬에서 실행해보기

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속.

## GitHub에 올리기

1. [github.com](https://github.com) 에서 새 저장소(Repository)를 만듭니다. (Public/Private 상관없음)
2. 이 폴더를 그 저장소에 올립니다:

```bash
cd holdem-server
git init
git add .
git commit -m "홀덤 분배기 초기 커밋"
git branch -M main
git remote add origin https://github.com/<내계정>/<저장소이름>.git
git push -u origin main
```

## Render에 배포하기

1. [render.com](https://render.com) 접속 후 GitHub 계정으로 로그인/연동합니다.
2. 대시보드에서 **New +** → **Web Service** 선택.
3. 방금 올린 GitHub 저장소를 선택합니다.
4. 설정값:
   - **Name**: 원하는 이름 (예: `holdem-dealer`)
   - **Region**: 아무 곳이나 (한국과 가까운 Singapore 추천)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (테스트용으로 충분)
5. **Create Web Service** 클릭 → 몇 분 후 배포 완료.
6. 완료되면 `https://holdem-dealer-xxxx.onrender.com` 같은 실제 웹 주소가 생깁니다.
   이 주소를 모바일 브라우저에서 열면 바로 사용 가능합니다.

> **참고**: Render 무료 플랜은 일정 시간 요청이 없으면 서버가 슬립(sleep) 상태가 되고,
> 다음 접속 시 깨어나는 데 몇십 초 정도 걸릴 수 있어요. 여러 명이 자주 쓸 계획이면
> 유료 플랜(Starter 이상)을 고려하세요.

## 사용 방법

1. 호스트: 웹 링크 접속 → "새 방 만들기" → 발급된 방 코드를 플레이어들에게 카톡 등으로 전달
2. 플레이어 1, 2: 같은 웹 링크 접속 → 방 코드 입력 → "플레이어 1" / "플레이어 2" 선택
3. 호스트가 "분배 시작"을 누르면 두 플레이어에게 실시간으로 홀카드가 지급되고,
   플랍/턴/리버/결과까지 그대로 진행됩니다.

## 구조

```
holdem-server/
├── server.js          # Express + Socket.io 서버 (방 관리, 상태 중계)
├── package.json
├── public/
│   └── index.html      # 클라이언트 (카드 분배 로직 + UI, 모두 이 파일 안에 포함)
└── README.md
```

방 상태는 서버 메모리에만 저장됩니다(DB 없음). 서버가 재시작되면 진행 중이던 방 정보는
사라지니, 필요하면 이후에 Redis 등으로 영속화할 수 있습니다.
