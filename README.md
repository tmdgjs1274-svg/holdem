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

1. 호스트: 웹 링크(`/`) 접속 → "방 만들기" → 화면에 **4자리 참가자 접속 코드**가 표시됨
2. 참가자: 별도 고정 링크 `/join` 접속 → **이름 → 방 코드** 순서로 입력 → "입장하기"
3. 호스트 화면에 참가자 이름이 실시간으로 표시되고, 각 이름 옆의 "내보내기"로 강퇴 가능
4. 호스트가 "분배 시작"을 누르면 두 참가자에게 홀카드가 지급되고, 플랍/턴/리버까지 진행
5. **리버 단계**: 각 참가자는 "카드를 공개할지" 토글로 선택 (기본값: 공개)
   - 참가자 화면에는 상대방 카드나 승패 결과가 절대 표시되지 않아요 (본인 카드만 보임)
6. 호스트가 "게임 종료"를 누르면 호스트 화면에서:
   - 각 참가자가 공개를 선택한 경우에만 그 사람의 카드가 보임 (비공개 선택시 계속 숨겨짐)
   - **두 명 모두 공개한 경우에만** 승패가 표시됨. 한 명이라도 비공개면 "아직 승패를 알 수 없어요" 안내만 표시
   - "다음 게임"을 누르면 대기 상태로 돌아가 새로 분배 가능

## 구조

```
holdem-server/
├── server.js          # Express + Socket.io 서버 (방 관리, 이름 기반 입장, 상태 중계)
├── package.json
├── public/
│   ├── index.html      # 호스트 화면 (방 생성, 코드 표시, 진행 제어)
│   └── join.html       # 참가자 화면 (고정 URL, 코드+이름 입장)
└── README.md
```

방 상태는 서버 메모리에만 저장됩니다(DB 없음). 서버가 재시작되면 진행 중이던 방 정보는
사라지니, 필요하면 이후에 Redis 등으로 영속화할 수 있습니다.

