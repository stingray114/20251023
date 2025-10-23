// =================================================================
// 步驟一：H5P 成績數據接收
// -----------------------------------------------------------------

// 確保這些變數是全域的
let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待分數..."; // 用於 p5.js 繪圖的文字
let fireworkParticles = []; // 用於儲存煙火粒子的陣列
let hasCelebrated = false; // 用於防止煙火在達到 100 分後重複發射

// H5P 消息監聽器
window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 更新全域變數
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 收到新分數後，如果分數不是 100 分，重置慶祝狀態
        if (maxScore > 0 && (finalScore / maxScore) * 100 < 100) {
            hasCelebrated = false;
        }

        // 收到新分數時，確保 draw() 執行
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);

// =================================================================
// 步驟二：Particle 類別 (煙火的構成元素) - 調整大小和壽命
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hu) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D(); // 隨機方向
        
        // !!! 增強效果 1: 增加粒子初始速度 (擴散範圍更大) !!!
        this.vel.mult(random(2, 6)); // 速度從 1~4 提高到 2~6
        
        this.acc = createVector(0, 0.08); // 稍微減小重力，讓粒子飄得久一點
        
        // !!! 增強效果 2: 增加粒子壽命 (讓粒子顯示更久) !!!
        this.lifespan = 300; // 壽命從 255 提高到 300
        
        this.hu = hu || random(360); // 隨機色相
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 3; // 壽命減量從 4 減少到 3，讓它活更久
    }

    show() {
        // 使用 HSB 顏色模式，H(0-360), S(0-100), B(0-100), A(0-100)
        noStroke();
        
        // 根據壽命調整透明度 (alpha)，使其逐漸消失
        let alpha = map(this.lifespan, 0, 300, 0, 100); 
        // 保持亮度 (B) 為 100 (最亮)
        fill(this.hu, 100, 100, alpha); 
        
        // !!! 增強效果 3: 增加粒子大小 !!!
        ellipse(this.pos.x, this.pos.y, 8); // 大小從 5 增加到 8
    }
    
    isFinished() {
        return this.lifespan < 0;
    }
}

// =================================================================
// 步驟三：放煙火的函式
// -----------------------------------------------------------------

function celebrateFirework(x, y) {
    // !!! 增強效果 4: 增加粒子數量 !!!
    const particleCount = 200; // 數量從 100 增加到 200
    let hu = random(360); // 為這束煙火選擇一個色相
    
    for (let i = 0; i < particleCount; i++) {
        fireworkParticles.push(new Particle(x, y, hu));
    }
}


// =================================================================
// 步驟四：p5.js 核心繪圖邏輯
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 將顏色模式設定為 HSB，方便處理顏色循環
    colorMode(HSB, 360, 100, 100, 100); 
    // 預設一個深色背景，讓煙火更突出
    background(0, 0, 0); 
} 

function draw() { 
    
    // !!! 關鍵優化 5: 調整背景透明度，減少拖尾殘影，增加閃爍感 !!!
    // 每次清除背景，透明度為 10，拖尾效果會較弱，閃爍感更強
    background(0, 0, 0, 10); // 黑色背景，透明度 10%
    
    // 計算分數百分比
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
    
    textSize(80); 
    textAlign(CENTER);
    
    // --- 1. 文本和圖形顯示邏輯 ---
    let displayColor;
    let mainText;
    
    if (percentage === 100) {
        displayColor = color(120, 100, 100); // 鮮豔綠色
        mainText = "恭喜！滿分！";
        
        // !!! 關鍵邏輯：發射煙火 !!!
        if (!hasCelebrated) {
            // 在畫布中心偏下方發射煙火
            celebrateFirework(width / 2, height / 2 + 100); 
            hasCelebrated = true; // 設置慶祝標記，防止重複發射
            console.log("Firework launched!");
        }
        
    } else if (percentage >= 90) {
        displayColor = color(100, 80, 80); 
        mainText = "優異成績！";
        
    } else if (percentage >= 60) {
        displayColor = color(50, 80, 100); 
        mainText = "成績良好，請再接再厲。";
        
    } else if (percentage > 0) {
        displayColor = color(0, 80, 100); 
        mainText = "需要加強努力！";
        
    } else {
        displayColor = color(0, 0, 60); 
        mainText = scoreText;
    }

    // 繪製文本
    fill(displayColor);
    text(mainText, width / 2, height / 2 - 50);

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 50); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // --- 2. 煙火粒子動畫邏輯 ---
    // 從後往前迭代，方便移除粒子
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
        fireworkParticles[i].update();
        fireworkParticles[i].show();
        
        // 如果粒子壽命結束，移除它
        if (fireworkParticles[i].isFinished()) {
            fireworkParticles.splice(i, 1); 
        }
    }
    
    // ----------------------------------------------------
    // 如果您想在煙火結束後將背景恢復成白色，可以取消註釋以下程式碼:
    /*
    if (fireworkParticles.length === 0 && hasCelebrated) {
        // 煙火結束後，恢復靜態顯示並將背景設為白色
        background(255);
        hasCelebrated = false; // 重設標記
        // 再次呼叫 draw 繪製靜態分數
        redraw();
    }
    */
    // ----------------------------------------------------
}
