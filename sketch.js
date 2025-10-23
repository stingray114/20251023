// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 新增：用於儲存煙火粒子的陣列
let fireworkParticles = []; 


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);

// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    colorMode(HSB, 360, 100, 100, 100); // 更改為 HSB 顏色模式，方便粒子顏色變換
    noLoop(); // 如果您希望分數只有在改變時才繪製，保留此行
} 

// 新增：Particle 類別 (用於定義每個煙火粒子的行為)
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
        this.lifespan -= 5; // 逐漸消失
    }

    show() {
        // 使用 HSB 顏色模式的顏色
        noStroke();
        fill(this.hu, 100, 100, this.lifespan / 255 * 100); 
        ellipse(this.pos.x, this.pos.y, 5);
    }
    
    isFinished() {
        return this.lifespan < 0;
    }
}

// 新增：放煙火的函式
function celebrateFirework(x, y, particleCount = 50) {
    let hu = random(360); // 為這束煙火選擇一個色相
    for (let i = 0; i < particleCount; i++) {
        fireworkParticles.push(new Particle(x, y, hu));
    }
    // 為了讓煙火動起來，暫時開啟 loop
    loop(); 
    // 在短暫延遲後停止 loop，確保粒子有時間繪製
    setTimeout(() => {
        if (fireworkParticles.length === 0) {
             noLoop();
        }
    }, 1000); // 1秒後檢查是否停止
}


// score_display.js 中的 draw() 函數片段

function draw() { 
    // 讓背景有一點點殘影，製造拖尾效果
    background(255, 15); // 清除背景 (添加少量透明度) 

    // 計算百分比
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // -----------------------------------------------------------------
        // 新增：100% 滿分時觸發煙火特效
        // -----------------------------------------------------------------
        if (percentage === 100 && fireworkParticles.length === 0) {
            // 滿分時且還沒有正在爆炸的粒子，則發射煙火
            celebrateFirework(width / 2, height / 2 + 150, 80);
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    
    // -----------------------------------------------------------------
    // 新增：更新並繪製煙火粒子
    // -----------------------------------------------------------------
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
        fireworkParticles[i].update();
        fireworkParticles[i].show();
        if (fireworkParticles[i].isFinished()) {
            fireworkParticles.splice(i, 1); // 移除已經結束生命的粒子
        }
    }
    
    // 如果所有粒子都已經消失，並且 loop() 仍處於開啟狀態，則關閉 loop()
    if (fireworkParticles.length === 0 && frameRate() > 0) {
        noLoop();
        // 為了確保分數文字能顯示清晰，重新繪製一次不帶透明度的背景
        background(255);
        redraw();
    }
}
