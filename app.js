let outerBlack = 180; // ●外枠
let doubleOuter = 150;
let doubleInner = 130;
let singleOuter = 130;
let tripleOuter = 90;
let tripleInner = 70;
let singleInner = 20;

let totalScore = 0;
let throwCount = 0;

let roundScores = [];

let isAdminMode = false;

// ●数字描画コード
  const sectors = [
    20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
    3, 19, 7, 16, 8, 11, 14, 9, 12, 5
  ];

let isDragging = false;
let previewX = null;
let previewY = null;

let previewScore = null;

let isTouchDevice = false;

const MAX_ROUND = 8;
const MAX_THROW = 3;
const MAX_TOTAL_THROWS = MAX_THROW * MAX_ROUND;

const boardRadius = 180;
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const centerX = 200;
const centerY = 200;

function drawCircle(radius, color) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ●的を描く
function drawBoard() {

  drawCircle(180, "black");
  // ●drawCircle(150, "green");
  // ●drawCircle(130, "white");
  for (let i = 0; i < 20; i++) {
    let startAngle = (i *18 - 9 - 90) * Math.PI / 180;
    let endAngle = ((i + 1) *18 - 9 - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(centerX, centerY, singleOuter, startAngle, endAngle);
    ctx.arc(centerX, centerY, tripleOuter, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = (i % 2 === 0) ? "black" : "white";
    ctx.fill();
  }

  for (let i = 0; i < 20; i++) {
    let startAngle = (i *18 - 9 - 90) * Math.PI / 180;
    let endAngle = ((i + 1) *18 - 9 - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(centerX, centerY, tripleInner, startAngle, endAngle);
    ctx.arc(centerX, centerY, singleInner, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = (i % 2 === 0) ? "black" : "white";
    ctx.fill();
  }

  // ●drawCircle(90, "red");
  for (let i = 0; i < 20; i++) {
    let startAngle = (i *18 - 9 - 90) * Math.PI / 180;
    let endAngle = ((i + 1) *18 - 9 - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(centerX, centerY, tripleOuter, startAngle, endAngle);
    ctx.arc(centerX, centerY, tripleInner, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = (i % 2 === 0) ? "red" : "green";
    ctx.fill();
  }

  for (let i = 0; i < 20; i++) {
    let startAngle = (i *18 - 9 - 90) * Math.PI / 180;
    let endAngle = ((i + 1) *18 - 9 - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(centerX, centerY, doubleOuter, startAngle, endAngle);
    ctx.arc(centerX, centerY, doubleInner, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = (i % 2 === 0) ? "red" : "green";
    ctx.fill();
  }

  // ●数字描画コード
  ctx.save();

  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 20; i++) {

    let angleDeg = i * 18; // セクター中心
    let angle = (angleDeg - 90) * Math.PI / 180;

    let numberRadius = boardRadius - 15; // 外枠より少し内側

    let x = centerX + Math.cos(angle) * numberRadius;
    let y = centerY + Math.sin(angle) * numberRadius;

    ctx.fillText(sectors[i], x, y);
  }

  ctx.restore();

    // ●的を描く
    drawCircle(20, "green");
    drawCircle(10, "red");
}

drawBoard();

// ●クリックイベント
// ●pointerdown（カーソル置く）
canvas.addEventListener("pointerdown", function(e) {

  if (!currentPlayer) {
    alert("先に名前を入力してスタートを押してください");
    return;
  }

  isTouchDevice = (e.pointerType === "touch");
  isDragging = true;

  const rect = canvas.getBoundingClientRect();
  previewX = (e.clientX - rect.left) * (canvas.width / rect.width);
  previewY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const offset = isTouchDevice ? 40 : 0;

  const drawX = previewX - offset;
  const drawY = previewY - offset;

  previewScore = calculateScore(drawX, drawY);

  redrawBoard();

});

// ●pointermove（カーソル表示）
canvas.addEventListener("pointermove", function(e) {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();
  previewX = (e.clientX - rect.left) * (canvas.width / rect.width);
  previewY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const offset = isTouchDevice ? 40 : 0;

  const drawX = previewX - offset;
  const drawY = previewY - offset;

  previewScore = calculateScore(drawX, drawY);

  redrawBoard();
});

// ●pointerup（ここで確定）
canvas.addEventListener("pointerup", function(e) {
  if (!isDragging) return;

  isDragging = false;

  const rect = canvas.getBoundingClientRect();
  previewX = (e.clientX - rect.left) * (canvas.width / rect.width);
  previewY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const offset = isTouchDevice ? 40 : 0;

  const drawX = previewX - offset;
  const drawY = previewY - offset;

  const score = calculateScore(drawX, drawY);

  registerThrow(score);

  previewX = null;
  previewY = null;
  previewScore = null;

  redrawBoard();
});

// calculateScore 関数化
function calculateScore(clickX, clickY) {

// ●中心基準に変換
  const x = clickX - centerX;
  const y = clickY - centerY;

// ●距離計算
  const distance = Math.sqrt(x*x + y*y);

// ●角度計算（ラジアン）
  let angle = Math.atan2(y, x) * 180 / Math.PI;

// ●度に変換
  angle = (angle + 360 + 90 + 9) % 360;

// 
  let index = Math.floor(angle / 18);
  let baseScore = sectors[index];

console.log("angle:", angle);
console.log("index:", index);
console.log("baseScore:", baseScore);

  let score = 0;

// ●クリック内の判定
  if (distance < singleInner / 2) {
    score = 50; // ブル
  } else if (distance < 20) {
    score = 25; // シングルブル
  } else if (distance < 70) {
    score = baseScore; // シングル
  } else if (distance < 90) {
    score = baseScore * 3; // トリプル
  } else if (distance < 130) {
    score = baseScore; // シングル
  } else if (distance < 150) {
    score = baseScore * 2; // ダブル
  } else {
    score = 0; // ボード外
  }

  return score;

}

// ●redrawBoard 関数
function redrawBoard() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBoard(); // →今ある描画コードをこの関数にまとめ

  if (previewX !== null && previewY !== null) {

    const offset = isTouchDevice ? 40 : 0;

    const drawX = previewX - offset;
    const drawY = previewY - offset;

    // ●ポインター
    ctx.beginPath();
    ctx.arc(drawX, drawY, isTouchDevice ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();

    // ●スコア表示
    if (typeof previewScore === "number") {

      ctx.save();

      // ●文字
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.fillStyle = "#FFD700";

      // ●カーソル近く
        ctx.strokeText(previewScore, drawX, drawY - 12);
        ctx.fillText(previewScore, drawX, drawY - 12);

      ctx.restore();
    }
  }
}

// ●スロー記録
function registerThrow(score) {

  totalScore += score;

  const currentRound = Math.floor(throwCount / MAX_THROW);

  if (!roundScores[currentRound]) {
    roundScores[currentRound] = [];
  }

  roundScores[currentRound].push(score);

  throwCount++;

    updateUI();


  if (throwCount === MAX_TOTAL_THROWS) {
    finishGame();
  }
}

// ●アップデートUI
function updateUI() {

  const round = throwCount === 0 ? 0 : Math.ceil(throwCount / MAX_THROW);
  const throwInRound = throwCount === 0 ? 0 : ((throwCount - 1) % MAX_THROW) +1;

  document.getElementById("round").textContent = round;
  document.getElementById("throw").textContent = throwInRound;
  document.getElementById("total").textContent = totalScore;

  const detailDiv = document.getElementById("roundDetails");

  if (detailDiv) {
    let html = "";

  roundScores.forEach((round, index) => {
    const roundTotal = round.reduce((sum, s) => sum + s, 0);

    html += `
      <div class="round-line">
        R${index + 1} :
        ${round.join(" / ")}
        = ${roundTotal}
      </div>
    `;
  });

  detailDiv.innerHTML = html;
}
}

// ●フィニッシュゲーム
function finishGame() {
  const finalScore = totalScore;

  // ●まず表示を確定
  updateUI();

  roundScores = [];

  // ●少し待ってからアラートとリセット
  setTimeout(() => {
  alert("ゲーム終了！　合計スコア:　" + finalScore);

  saveScore(finalScore);  //API送信

    throwCount = 0;
    totalScore = 0;
    updateUI();

  }, 50);
}

updateUI();

console.log("ranking script loaded");

loadRanking();

// ●セーブスコア
async function saveScore(score) {

  await fetch("https://x2g3f6m0b7.execute-api.ap-northeast-1.amazonaws.com/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      playerId: currentPlayer,
      score: score,
      round: MAX_ROUND
    })
  });

  loadMyBestScore();
  loadRanking();

}

// ●ロードランキング
async function loadRanking() {
  try {
    const response = await fetch("https://x2g3f6m0b7.execute-api.ap-northeast-1.amazonaws.com/ranking");


    const data = await response.json();
    displayRanking(data);

  } catch (error) {
    console.error("ランキング取得失敗:", error);
  }
}

// ●ディスプレイランキング
function displayRanking(data) {

  const rankingDiv = document.getElementById("rankingList");
  rankingDiv.innerHTML = "";

  data.forEach((item, index) => {

    let deleteButton = "";

    if (isAdminMode) {
      deleteButton = `
        <button onclick="deleteScore('${item.playerId}')"
                style="font-size:11px; opacity:0.6;">
          削除
        </button>
      `;
    }

    rankingDiv.innerHTML += `
      ${index + 1}位 : ${item.playerId} - ${item.bestScore}
      ${deleteButton}
      <br>
    `;
  });
}

// ●Undoスロー
document.getElementById("undoBtn").addEventListener("click", undoThrow);

function undoThrow() {

  if (throwCount === 0) return;

  throwCount--;

  const roundIndex = Math.floor(throwCount / MAX_THROW);

  if (!roundScores[roundIndex]) return;

  const lastScore = roundScores[roundIndex].pop() || 0;

  totalScore -= lastScore;

  if (roundScores[roundIndex].length === 0) {
    roundScores.pop();
  }

  updateUI();
}

// ●プレイヤー名を保持
let currentPlayer = null;

document.getElementById("startBtn").addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();

  if (!name) {
    alert("名前を入力してください");
    return;
  }

  currentPlayer = name;

  loadMyBestScore();
});

// ●自分のハイスコアを取得
async function loadMyBestScore() {

  if (!currentPlayer) return;

  const response = await fetch(
    `https://x2g3f6m0b7.execute-api.ap-northeast-1.amazonaws.com/score?playerId=${currentPlayer}`
  );

  const data = await response.json();

  const best = data.bestScore || 0;

  document.getElementById("myBestScore").innerHTML =
    `あなたのハイスコア: ${best}`;
}

// ●deleteScore関数
async function deleteScore(playerId) {

  const pw = prompt("管理パスワードを入力してください");

  if (pw !== "admin123") {    // ←任意のパスワードに変更可
    alert("権限がありません");
    return;
  }

  await fetch(
    `https://x2g3f6m0b7.execute-api.ap-northeast-1.amazonaws.com/delete?playerId=${playerId}`,
    {
      method: "DELETE"
    }
  );

  loadRanking();
}

// ●パスワード認証
document.getElementById("adminBtn").addEventListener("click", () => {
  const pw = prompt("管理パスワードを入力");

  if (pw === "admin123") {    // ←任意のパスワードに変更可
    isAdminMode = true;
    alert("管理モードON");
    loadRanking();
  } else {
    alert("パスワードが違います");
  }
});

// ●end
    
