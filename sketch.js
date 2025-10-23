// =================================================================
// 步驟一：H5P 成績數據接收
// -----------------------------------------------------------------

// 確保這些變數是全域的
let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待分數..."; // 用於 p5.js 繪圖的文字
let fireworkParticles = []; // 用於儲存煙火粒子的陣列
let hasCelebrated = false; // 新增：用於防止煙火在達到 100 分後重複發射

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
// 步驟二：Particle 類別 (煙火的構成元素)
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hu) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D(); // 隨機方向
        this.vel.mult(random(1, 4)); // 隨機速度
        this.acc = createVector(0, 0.1); // 簡易重力
        this.lifespan = 255;
        this.hu = hu || random(360); // 隨機色相
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 4; // 稍微增加消失速度
    }

    show() {
        noStroke();
        // 顏色使用 HSB 模式，並根據 lifespan 調整透明度 (alpha)
        let alpha = map(this.lifespan, 0, 255, 0, 100); 
        fill(this.hu, 100, 100, alpha); 
        ellipse(this.pos.x, this.pos.y, 5);
    }
    
    isFinished() {
        return this.lifespan < 0;
    }
}

// =================================================================
// 步驟三：放煙火的函式
// -----------------------------------------------------------------

function celebrateFirework(x, y, particleCount = 100) {
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
    // H(0-360), S(0-100), B(0-100), A(0-100)
    colorMode(HSB, 360, 100, 100, 100); 
    
    // !!! 關鍵修改：從一開始就執行 loop() !!!
    // 為了確保煙火動畫能持續運行，我們不使用 noLoop()
} 

function draw() { 
    // !!! 關鍵修改：使用帶透明度的背景，創造粒子拖尾效果 !!!
    background(0, 0, 0, 15); // 接近黑色的背景 (B=0)，透明度 15%
    
    // 計算分數百分比
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
    
    textSize(80); 
    textAlign(CENTER);
    
    // --- 1. 文本和圖形顯示邏輯 ---
    let displayColor;
    let mainText;
    
    if (percentage === 100) {
        displayColor = color(120, 100, 100); // 綠色
        mainText = "恭喜！滿分！";
        
        // !!! 關鍵邏輯：發射煙火 !!!
        // 只有在滿分且尚未慶祝時才發射
        if (!hasCelebrated) {
            // 在畫布中心偏下方發射煙火
            celebrateFirework(width / 2, height / 2 + 100, 150); 
            hasCelebrated = true; // 設置慶祝標記，防止重複發射
        }
        
    } else if (percentage >= 90) {
        displayColor = color(100, 80, 80); // 偏黃綠
        mainText = "優異成績！";
        
    } else if (percentage >= 60) {
        displayColor = color(50, 80, 100); // 黃色
        mainText = "成績良好，請再接再厲。";
        
    } else if (percentage > 0) {
        displayColor = color(0, 80, 100); // 紅色
        mainText = "需要加強努力！";
        
    } else {
        displayColor = color(0, 0, 60); // 灰色
        mainText = scoreText;
    }

    // 繪製文本
    fill(displayColor);
    text(mainText, width / 2, height / 2 - 50);

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 50); // 深灰色
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
}
