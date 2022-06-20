//Check for local highscore
if (localStorage.highScore) localStorage.highScore = Number(localStorage.highScore);
else localStorage.highScore = 0;

let audioElement = document.getElementById('audioButton');
let bodyElement = document.getElementById('body');
let canvas = document.getElementById('canvas');
let brush = canvas.getContext('2d');
let canvasBackground = new Image();
canvasBackground.onload = function () {
	brush.drawImage(canvasBackground, canvasBackground.width, canvasBackground.height);
};
canvasBackground.src = 'img/canvasBackground.png';
let canvasBackgroundX = 0;
let canvasBackgroundY = 0;
let canvasTransitionColor;
let canvasTransitionPosition;
let refreshCanvas;
let stopWatch;
let currentLevel;
let createBossBulletInterval;
let createCompBirdInterval;
let player;
let boss;
let compBirdsArray = [];
let playerBulletsArray = [];
let bossBulletsArray = [];
let bloodArray = [];
let addToPlayerStatsArray = [];
CanvasTitle();

let gameKeys = {
	moveUp: false,
	moveDown: false,
	moveLeft: false,
	moveRight: false,
	fire: false,
	newGame: false,
	audio: false,
};

bodyElement.addEventListener('keydown', function (event) {
	if (event.key === 'ArrowUp' || event.key === 'w') gameKeys.moveUp = true;
	if (event.key === 'ArrowDown' || event.key === 's') gameKeys.moveDown = true;
	if (event.key === 'ArrowLeft' || event.key === 'a') gameKeys.moveLeft = true;
	if (event.key === 'ArrowRight' || event.key === 'd') gameKeys.moveRight = true;
	if (event.key === ' ') gameKeys.fire = true;
	if (event.key === 'r') {
		gameKeys.newGame = true;
		document.getElementById('startButton').click();
	}
	if (event.key === 'm') {
		gameKeys.audio = true;
		document.getElementById('audioButton').click();
	}
});

bodyElement.addEventListener('keyup', function (event) {
	if (event.key === 'ArrowUp' || event.key === 'w') gameKeys.moveUp = false;
	if (event.key === 'ArrowDown' || event.key === 's') gameKeys.moveDown = false;
	if (event.key === 'ArrowLeft' || event.key === 'a') gameKeys.moveLeft = false;
	if (event.key === 'ArrowRight' || event.key === 'd') gameKeys.moveRight = false;
	if (event.key === ' ') gameKeys.fire = false;
	if (event.key === 'r') gameKeys.newGame = false;
	if (event.key === 'm') gameKeys.audio = false;
});

class Player {
	constructor(x, y) {
		this.x = x;
		this.maxX = 610;
		this.y = y;
		this.dX = 4.7;
		this.dY = 4.7;
		this.image = new Image();
		this.image.src = 'img/player.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 75;
		this.spriteHeight = 50;
		this.spriteSpeedInitial = 5;
		this.spriteSpeed = this.spriteSpeedInitial;
		this.fireRateInitial = 12;
		this.fireRate = this.fireRateInitial;
		this.magazineInitial = 16;
		this.magazine = this.magazineInitial;
		this.reloadTimerInitial = 300;
		this.reloadTimer = this.reloadTimerInitial;
		this.score = 0;
		this.kills = 0;
		this.deathCause = '';
		this.gotWin = false;
		this.isDead = false;
		this.HUDauraSwitch = true;
		this.HUDaura = 0;
		this.fireAudio = document.getElementById('playerFireAudio');
		this.reloadAudio = document.getElementById('playerReloadAudio');
		this.reloadedAudio = document.getElementById('playerReloadedAudio');
		this.hitAudio = document.getElementById('playerHitAudio');
		this.wingAudio = document.getElementById('playerWingAudio');
	}

	Move() {
		if (gameKeys.moveUp) {
			let newY = this.y - this.dY;
			if (newY > 0) this.y = newY;
		}
		if (gameKeys.moveDown) {
			let newY = this.y + this.dY;
			if (newY + this.spriteHeight < canvas.height) this.y = newY;
		}
		if (gameKeys.moveLeft) {
			let newX = this.x - this.dX;
			if (newX > 0) this.x = newX;
		}
		if (gameKeys.moveRight) {
			let newX = this.x + this.dX;
			if (newX + this.spriteWidth < this.maxX) this.x = newX;
		}
	}

	Fire() {
		if (this.magazine == 0) {
			this.reloadTimer--;
			this.PlayReloadAudio();
		}
		if (this.reloadTimer == 0) {
			this.reloadTimer = this.reloadTimerInitial;
			this.magazine = this.magazineInitial;
			this.PlayReloadedAudio();
		}
		if (gameKeys.fire && this.magazine > 0) {
			if (this.fireRate == 0) {
				//+0.01 in the x coordinate prevents player bullet collision
				let bullet = new PlayerBullet(this.x + this.spriteWidth + 0.01, this.y + this.spriteHeight * 0.5 + 5);

				playerBulletsArray.push(bullet);
				this.fireRate = this.fireRateInitial;
				this.magazine--;
				this.PlayFireAudio();
			} else this.fireRate--;
		}
	}

	Draw() {
		this.Fire();
		this.Move();
		brush.drawImage(this.image, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.image.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}

	DrawHUD() {
		if (currentLevel < 3) {
			if (this.HUDaura <= 0.5) this.HUDaura += 0.005;
			brush.globalAlpha = this.HUDaura.toFixed(3);
			brush.fillStyle = 'gray';
			brush.fillRect(0, 0, canvas.width, 10);
			brush.fillStyle = 'green';
			brush.fillRect(0, 0, (stopWatch / boss.phase1) * canvas.width, 10);
		} else if (currentLevel == 3) {
			if (this.HUDaura > 0) this.HUDaura -= 0.005;
			brush.globalAlpha = this.HUDaura.toFixed(3);
			brush.fillStyle = 'green';
			brush.fillRect(0, 0, canvas.width, 10);
		}
		if (currentLevel < 4) {
			brush.fillStyle = 'black';
			brush.fillRect(canvas.width * (140 / boss.phase1), 0, 3, 10);
			brush.fillRect(canvas.width * (700 / boss.phase1), 0, 3, 10);
		}
		if (currentLevel == 1) {
			if (this.HUDauraSwitch) {
				brush.globalAlpha = 0;
				this.HUDauraSwitch = false;
			}
			if (this.HUDaura <= 0.5) this.HUDaura += 0.005;
			brush.globalAlpha = this.HUDaura.toFixed(3);
		} else brush.globalAlpha = 0.5;
		brush.textAlign = 'center';
		brush.font = '22px Times New Roman';
		if (this.y >= canvas.height - this.spriteHeight * 1.5) {
			if (this.magazine > 0) brush.fillText(this.magazine + ' / ∞', this.x + this.spriteWidth * 0.45, this.y - this.spriteHeight * 0.15);
			else brush.fillText('⟲ / ∞', this.x + this.spriteWidth * 0.45, this.y - this.spriteHeight * 0.15);
		} else {
			if (this.magazine > 0) brush.fillText(this.magazine + ' / ∞', this.x + this.spriteWidth * 0.45, this.y + this.spriteHeight * 1.4);
			else brush.fillText('⟲ / ∞', this.x + this.spriteWidth * 0.45, this.y + this.spriteHeight * 1.4);
		}
		brush.textAlign = 'right';
		brush.fillStyle = 'black';
		brush.font = '30px Times New Roman';
		brush.fillText(this.score + ' PTS', canvas.width * 0.985, canvas.height * 0.97);
		brush.globalAlpha = 0.4;
		brush.textAlign = 'center';
		brush.font = 'bold 35px Times New Roman';
		if (this.x + this.spriteWidth >= this.maxX - 3 && currentLevel < 5) {
			brush.fillText('⛔', canvas.width * 0.6625, canvas.height * 0.165);
			brush.fillText('⛔', canvas.width * 0.6625, canvas.height * 0.545);
			brush.fillText('⛔', canvas.width * 0.6625, canvas.height * 0.9);
		}
		brush.globalAlpha = 1;
	}

	PlayFireAudio() {
		this.fireAudio.play();
	}

	PlayReloadAudio() {
		this.reloadAudio.play();
	}

	PlayReloadedAudio() {
		this.reloadedAudio.play();
	}

	PlayWingAudio() {
		this.wingAudio.play();
	}

	PlayHitAudio() {
		this.hitAudio.play();
	}
}

class Boss {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dX = -2.5;
		this.dY = 0;
		this.dYTimerInitial = 180;
		this.dYTimer = this.dYTimerInitial;
		this.imagePhase1 = new Image();
		this.imagePhase1.src = 'img/boss1.png';
		this.imagePhase2 = new Image();
		this.imagePhase2.src = 'img/boss2.png';
		this.imagePhase3 = new Image();
		this.imagePhase3.src = 'img/boss3.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 445.875;
		this.spriteHeight = 300;
		this.spriteSpeedInitial = 14;
		this.spriteSpeed = this.spriteSpeedInitial;
		this.healthInitial = 60;
		this.health = this.healthInitial;
		this.phase1 = 1800;
		this.phase2 = this.healthInitial * (2 / 3);
		this.phase3 = this.healthInitial * (1 / 3);
		this.postDeathTimerInitial = 250;
		this.postDeathTimer = this.postDeathTimerInitial;
		this.postDeathAddToPlayerStatsSwitch = false;
		this.healthBarAura = 0;
		this.hitAudio = document.getElementById('bossHitAudio');
		this.distantCryAudio = document.getElementById('bossDistantCryAudio');
		this.closeCryAudio = document.getElementById('bossCloseCryAudio');
		this.phase1Audio = document.getElementById('bossPhase1Audio');
		this.phase2Audio = document.getElementById('bossPhase2Audio');
		this.phase3Audio = document.getElementById('bossPhase3Audio');
		this.explodeAudio = document.getElementById('bossExplodeAudio');
	}

	Move() {
		let newX = this.x + this.dX;
		let newY = this.y + this.dY;
		if (this.postDeathTimer == this.postDeathTimerInitial) {
			if (this.dYTimer == 0) {
				this.dY = GetRandomNumber(-3, 3);
				this.dYTimer = this.dYTimerInitial;
			} else this.dYTimer--;
			if (newX > canvas.width - 300) this.x = newX;
			else this.dX = 0;
			if (newY < -100 || newY > canvas.height - 200) this.dY = -this.dY;
			else this.y = newY;
		} else {
			this.y = newY;
			this.x = newX;
		}
	}

	Draw() {
		this.Move();
		if (this.health >= this.phase2) brush.drawImage(this.imagePhase1, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		else if (this.health >= this.phase3) brush.drawImage(this.imagePhase2, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		else brush.drawImage(this.imagePhase3, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.imagePhase1.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;

		//Collision logic between player bullet and boss
		if (this.health > 0) {
			for (let i = 0; i < playerBulletsArray.length; i++) {
				if (
					playerBulletsArray[i].x >= this.x + this.spriteWidth * 0.4 &&
					playerBulletsArray[i].y >= this.y + this.spriteHeight * 0.11 &&
					playerBulletsArray[i].y <= this.y + this.spriteHeight * 0.85
				) {
					if (this.y >= -39) CreateAddToPlayerStats(this.x + this.spriteWidth * 0.1, this.y + this.spriteHeight * 0.25, 50, 0);
					else CreateAddToPlayerStats(this.x + this.spriteWidth * 0.1, this.y + this.spriteHeight * 0.25 + 200, 50, 0);
					this.health--;
					CreateBlood(this.x + 175, this.y + 150, GetRandomNumber(1.5, 2), 'red', 2);
					CreateBlood(this.x + 175, this.y + 150, GetRandomNumber(2, 3), 'red', 2);
					this.PlayHitAudio();
					playerBulletsArray.splice(i, 1);
					i--;
				}
			}
		} else {
			//Player win logic
			if (this.postDeathTimer > 0) {
				for (let i = 0; i < bossBulletsArray.length; i++) {
					bossBulletsArray[i].dY += 0.15;
					bossBulletsArray[i].dX -= 0.075;
				}
				this.dY += 0.15;
				this.dX -= 0.075;
				CreateBlood(this.x + 175, this.y + 150, GetRandomNumber(2, 3), 'red', 1);
				CreateBlood(this.x + 175, this.y + 150, GetRandomNumber(4, 5), 'pink', 1);
				if (this.y > canvas.height && bossBulletsArray.length == 0 && !this.postDeathAddToPlayerStatsSwitch) {
					CreateAddToPlayerStats(this.x + this.spriteWidth * 0.1, canvas.height * 0.96, 2000, 1);
					this.postDeathAddToPlayerStatsSwitch = true;
				}
				this.PlayExplodeAudio();
				if (this.postDeathTimer < 22 && canvasTransitionPosition < 540) CanvasTransition();
				this.postDeathTimer--;
			} else player.gotWin = true;
		}
	}

	DrawHealthBar() {
		if (this.healthBarAura <= 0.4) this.healthBarAura += 0.005;
		brush.globalAlpha = this.healthBarAura.toFixed(3);
		brush.fillStyle = 'black';
		brush.fillRect(canvas.width * 0.35, canvas.height * 0.9325, canvas.width * 0.3, 20);
		brush.fillStyle = 'rgb(255, 0, 0)';
		brush.fillRect(canvas.width * 0.35, canvas.height * 0.9325, (this.health / this.healthInitial) * canvas.width * 0.3, 20);
		brush.fillStyle = 'black';
		brush.fillRect(canvas.width * 0.3 * (1 / 3) + canvas.width * 0.35, canvas.height * 0.9325, 3, 20);
		brush.fillRect(canvas.width * 0.3 * (2 / 3) + canvas.width * 0.35, canvas.height * 0.9325, 3, 20);
		brush.globalAlpha = 1;
	}

	PlayHitAudio() {
		this.hitAudio.play();
	}

	PlayDistantCryAudio() {
		this.distantCryAudio.play();
	}

	PlayCloseCryAudio() {
		this.closeCryAudio.play();
	}

	PlayPhase1Audio() {
		if (this.health >= this.phase2) this.phase1Audio.play();
		else this.phase1Audio.pause();
	}

	PlayPhase2Audio() {
		if (this.health >= this.phase3) this.phase2Audio.play();
		else this.phase2Audio.pause();
	}

	PlayPhase3Audio() {
		if (this.postDeathTimer == this.postDeathTimerInitial) this.phase3Audio.play();
		else this.phase3Audio.pause();
	}

	PlayExplodeAudio() {
		this.explodeAudio.play();
	}
}

class CompBird {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dX = GetRandomNumber(-6, -7);
		this.dY = 0;
		this.imagePhase1 = new Image();
		this.imagePhase1.src = 'img/compBird1.png';
		this.imagePhase2 = new Image();
		this.imagePhase2.src = 'img/compBird2.png';
		this.imagePhase3 = new Image();
		this.imagePhase3.src = 'img/compBird3.png';
		this.imagePhase4 = new Image();
		this.imagePhase4.src = 'img/compBird4.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 75;
		this.spriteHeight = 50;
		this.spriteSpeedInitial = GetRandomNumber(4, 7);
		this.spriteSpeed = this.spriteSpeedInitial;
		this.healthInitial = 4;
		this.health = this.healthInitial;
		this.hitAudio = document.getElementById('compBirdHitAudio');
		this.cryAudio = document.getElementById('compBirdCryAudio');
	}

	Move() {
		let newX = this.x + this.dX;
		this.x = newX;
		let newY = this.y + this.dY;
		this.y = newY;
	}

	Draw() {
		this.Move();
		if (this.health == this.healthInitial) brush.drawImage(this.imagePhase1, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		else if (this.health >= this.healthInitial * (3 / 4)) brush.drawImage(this.imagePhase2, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		else if (this.health >= this.healthInitial * (1 / 2)) brush.drawImage(this.imagePhase3, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		else brush.drawImage(this.imagePhase4, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.imagePhase1.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}

	PlayHitAudio() {
		this.hitAudio.play();
	}

	PlayCryAudio() {
		this.cryAudio.play();
	}
}

class PlayerBullet {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.radius = 7;
		this.dX = 13;
		this.dY = 0;
		this.color = 'cyan';
		this.aura = 0.4;
	}

	Move() {
		let newX = this.x + this.dX;
		this.x = newX;
		let newY = this.y + this.dY;
		this.y = newY;
	}

	Draw() {
		this.Move();
		brush.beginPath();
		brush.globalAlpha = this.aura.toFixed(3);
		brush.arc(this.x, this.y, this.radius * 1.65, ToRadians(0), ToRadians(360));
		brush.closePath();
		brush.fillStyle = this.color;
		brush.fill();
		brush.globalAlpha = 1;
		brush.beginPath();
		brush.arc(this.x, this.y, this.radius, ToRadians(0), ToRadians(360));
		brush.closePath();
		brush.fillStyle = this.color;
		brush.fill();
		brush.strokeStyle = 'black';
		brush.lineWidth = 2.5;
		brush.stroke();
	}
}

class BossBullet {
	constructor(x, y, radius, dX, dY, colorType) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.dX = dX;
		this.dY = dY;
		this.colorType = colorType;
		this.auraSwitch = true;
		this.aura = 0;
		this.distantFireAudio = document.getElementById('bossBulletDistantFireAudio');
		this.closeFireAudio = document.getElementById('bossBulletCloseFireAudio');
		this.deflectAudio = document.getElementById('bossBulletDeflectAudio');
	}

	Move() {
		let newX = this.x + this.dX;
		this.x = newX;
		let newY = this.y + this.dY;
		this.y = newY;
	}

	Draw() {
		this.Move();
		if (this.aura >= 0.2) this.auraSwitch = true;
		else if (this.aura <= 0) this.auraSwitch = false;
		if (this.auraSwitch) this.aura -= 0.005;
		else if (!this.auraSwitch) this.aura += 0.005;
		brush.beginPath();
		brush.globalAlpha = this.aura.toFixed(3);
		brush.arc(this.x, this.y, this.radius * 1.65, ToRadians(0), ToRadians(360));
		brush.closePath();
		if (this.colorType == 1) brush.fillStyle = 'rgb(236, 28, 36)';
		else if (this.colorType == 2 || this.colorType == 3) brush.fillStyle = 'black';
		brush.fill();
		brush.beginPath();
		brush.globalAlpha = 1;
		brush.arc(this.x, this.y, this.radius, ToRadians(0), ToRadians(360));
		brush.closePath();
		if (this.colorType == 1 || this.colorType == 3) brush.strokeStyle = 'black';
		else if (this.colorType == 2) brush.strokeStyle = 'red';
		brush.lineWidth = 10;
		brush.stroke();
		brush.fill();
		if (this.colorType == 1 || this.colorType == 2) {
			brush.beginPath();
			brush.arc(this.x, this.y, this.radius * 0.75, ToRadians(0), ToRadians(360));
			brush.closePath();
			brush.fillStyle = 'firebrick';
			brush.fill();
			brush.beginPath();
			brush.arc(this.x, this.y, this.radius * 0.5, ToRadians(0), ToRadians(360));
			brush.closePath();
			brush.fillStyle = 'darkred';
			brush.fill();
			brush.beginPath();
			brush.arc(this.x, this.y, this.radius * 0.25, ToRadians(0), ToRadians(360));
			brush.closePath();
			brush.fillStyle = 'maroon';
			brush.fill();
		}
	}

	PlayDistantFireAudio() {
		this.distantFireAudio.play();
	}

	PlayCloseFireAudio() {
		this.closeFireAudio.play();
	}

	PlayDeflectAudio() {
		this.deflectAudio.play();
	}
}

class BossBullet1 extends BossBullet {
	constructor(x, y, radius, dX, dY, colorType) {
		super(x, y, radius, dX, dY, colorType);
		this.image = new Image();
		this.image.src = 'img/bossSymbol1.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 32.875;
		this.spriteHeight = 35;
		this.spriteSpeedInitial = 16;
		this.spriteSpeed = this.spriteSpeedInitial;
	}

	Draw() {
		super.Draw();
		brush.drawImage(this.image, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x - this.spriteWidth * (1 / 2), this.y - this.spriteHeight * (1 / 2), this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.image.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}
}

class BossBullet2 extends BossBullet {
	constructor(x, y, radius, dX, dY, colorType) {
		super(x, y, radius, dX, dY, colorType);
		this.image = new Image();
		this.image.src = 'img/bossSymbol2.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 61;
		this.spriteHeight = 65;
		this.spriteSpeedInitial = 16;
		this.spriteSpeed = this.spriteSpeedInitial;
	}

	Draw() {
		super.Draw();
		brush.drawImage(this.image, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x - this.spriteWidth * (1 / 2), this.y - this.spriteHeight * (1 / 2), this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.image.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}
}

class BossBullet3 extends BossBullet {
	constructor(x, y, radius, dX, dY, colorType) {
		super(x, y, radius, dX, dY, colorType);
		this.image = new Image();
		this.image.src = 'img/bossSymbol3.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 75;
		this.spriteHeight = 80;
		this.spriteSpeedInitial = 16;
		this.spriteSpeed = this.spriteSpeedInitial;
	}

	Draw() {
		super.Draw();
		brush.drawImage(this.image, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x - this.spriteWidth * (1 / 2), this.y - this.spriteHeight * (1 / 2), this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.image.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}
}

class BossBullet4 extends BossBullet {
	constructor(x, y, radius, dX, dY, colorType) {
		super(x, y, radius, dX, dY, colorType);
		this.image = new Image();
		this.image.src = 'img/bossSymbol4.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 89.125;
		this.spriteHeight = 95;
		this.spriteSpeedInitial = 16;
		this.spriteSpeed = this.spriteSpeedInitial;
	}

	Draw() {
		super.Draw();
		brush.drawImage(this.image, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x - this.spriteWidth * (1 / 2), this.y - this.spriteHeight * (1 / 2), this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.image.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}
}

class BossBullet5 extends BossBullet {
	constructor(x, y, radius, dX, dY, colorType) {
		super(x, y, radius, dX, dY, colorType);
		this.image = new Image();
		this.image.src = 'img/bossSymbol5.png';
		this.spriteX = 0;
		this.spriteY = 0;
		this.spriteWidth = 770;
		this.spriteHeight = 750;
		this.spriteSpeedInitial = 16;
		this.spriteSpeed = this.spriteSpeedInitial;
	}

	Draw() {
		super.Draw();
		brush.drawImage(this.image, this.spriteX, 0, this.spriteWidth, this.spriteHeight, this.x - this.spriteWidth * (1 / 2), this.y - this.spriteHeight * (1 / 2), this.spriteWidth, this.spriteHeight);
		if (this.spriteSpeed == 0) {
			this.spriteX += this.spriteWidth;
			if (this.spriteX >= this.image.width) this.spriteX = 0;
			this.spriteSpeed = this.spriteSpeedInitial;
		} else this.spriteSpeed--;
	}
}

class Blood {
	constructor(x, y, radius, color) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.dX = GetRandomNumber(-13, -10);
		this.dY = GetRandomNumber(-6.5, 7.5);
		this.color = color;
	}

	Move() {
		let newX = this.x + this.dX;
		this.x = newX;
		let newY = this.y + this.dY;
		this.y = newY;
	}

	Draw() {
		this.Move();
		brush.beginPath();
		brush.arc(this.x, this.y, this.radius, ToRadians(0), ToRadians(360));
		brush.closePath();
		brush.fillStyle = this.color;
		brush.fill();
	}
}

class AddToPlayerStats {
	constructor(x, y, addToScore, addToKills) {
		this.x = x;
		this.y = y;
		this.addToScore = addToScore;
		player.score += addToScore;
		player.kills += addToKills;
		this.aura = 0.3;
	}

	Draw() {
		if (this.aura > 0) {
			this.y -= 0.3;
			brush.globalAlpha = this.aura;
			brush.fillStyle = 'black';
			brush.textAlign = 'left';
			brush.font = '30px Times New Roman';
			brush.fillText(this.addToScore + '+', this.x, this.y);
			this.aura -= 0.005;
			brush.globalAlpha = 1;
		}
	}
}

function ToRadians(degrees) {
	return (degrees * Math.PI) / 180;
}

function GetRandomNumber(a, b) {
	if (a > b) {
		small = b;
		large = a;
	} else {
		small = a;
		large = b;
	}
	let number = parseInt(Math.random() * (large - small + 1)) + small;
	return number;
}

function CircleRectangleCollision(circle, rectangle) {
	let DEX = Math.abs(circle.x - (rectangle.x + rectangle.spriteWidth * 0.5));
	let DEY = Math.abs(circle.y - (rectangle.y + rectangle.spriteHeight * 0.5));
	let dex = DEX - rectangle.spriteWidth * 0.5;
	let dey = DEY - rectangle.spriteHeight * 0.5;
	if (
		(DEX <= rectangle.spriteWidth * 0.5 && DEY <= rectangle.spriteHeight * 0.5) ||
		(!(DEX > rectangle.spriteWidth * 0.5 + circle.radius) && !(DEY > rectangle.spriteHeight * 0.5 + circle.radius)) ||
		dex * dex + dey * dey <= Math.pow(circle.radius, 2)
	)
		return true;
	else return false;
}

function CircleCircleCollision(circle1, circle2) {
	let dex = circle1.x - circle2.x;
	let dey = circle1.y - circle2.y;
	let dist = Math.sqrt(dex * dex + dey * dey);
	if (dist < circle1.radius + circle2.radius) return true;
	else return false;
}

function RectangleRectangleCollision(rectangle1, rectangle2) {
	if (
		!(
			rectangle1.x > rectangle2.x + rectangle2.spriteWidth ||
			rectangle2.x > rectangle1.x + rectangle1.spriteWidth ||
			rectangle1.y > rectangle2.y + rectangle2.spriteHeight ||
			rectangle2.y > rectangle1.y + rectangle1.spriteHeight
		)
	)
		return true;
	else return false;
}

function CreateBossBullet(x, y, radius, dX, dY, caseType, colorType, symbolType, soundType, frequency) {
	if (boss.postDeathTimer == boss.postDeathTimerInitial) {
		if (createBossBulletInterval == 0) {
			switch (caseType) {
				case 1:
					let bossBullet;
					if (symbolType == 1) bossBullet = new BossBullet1(x, y, radius, dX, dY, colorType);
					else if (symbolType == 2) bossBullet = new BossBullet2(x, y, radius, dX, dY, colorType);
					else if (symbolType == 3) bossBullet = new BossBullet3(x, y, radius, dX, dY, colorType);
					else if (symbolType == 4) bossBullet = new BossBullet4(x, y, radius, dX, dY, colorType);
					else if (symbolType == 5) bossBullet = new BossBullet5(x, y, radius, dX, dY, colorType);
					bossBulletsArray.push(bossBullet);
					if (soundType == 1) bossBullet.PlayDistantFireAudio();
					else if (soundType == 2) bossBullet.PlayCloseFireAudio();
					break;
				case 2:
					let bossBulletDecider = GetRandomNumber(0, 2);
					if (bossBulletDecider == 0) {
						for (let i = -0.5; i <= 0.5; i++) {
							let bossBullet = new BossBullet4(x, y, 80, -3, i, colorType);
							bossBulletsArray.push(bossBullet);
							if (i == -0.5) {
								if (soundType == 1) bossBullet.PlayDistantFireAudio();
								else if (soundType == 2) bossBullet.PlayCloseFireAudio();
							}
						}
					} else if (bossBulletDecider == 1) {
						for (let i = -0.6; i <= 0.6; i += 0.6) {
							let bossBullet = new BossBullet3(x, y, 60, -3, i, colorType);
							bossBulletsArray.push(bossBullet);
							if (i == -0.6) {
								if (soundType == 1) bossBullet.PlayDistantFireAudio();
								else if (soundType == 2) bossBullet.PlayCloseFireAudio();
							}
						}
					} else {
						for (let i = -5; i <= 5; i++) {
							let bossBullet = new BossBullet1(x, y, 25, GetRandomNumber(-3, -1), i, colorType);
							bossBulletsArray.push(bossBullet);
							if (i == -5) {
								if (soundType == 1) bossBullet.PlayDistantFireAudio();
								else if (soundType == 2) bossBullet.PlayCloseFireAudio();
							}
						}
					}
					break;
			}
			createBossBulletInterval = frequency;
		} else createBossBulletInterval--;
	}
}

function CreateCompBird() {
	if (createCompBirdInterval == 0) {
		let compBird = new CompBird(canvas.width + 100, GetRandomNumber(0, canvas.height - 50));
		compBirdsArray.push(compBird);
		compBird.PlayCryAudio();
		createCompBirdInterval = GetRandomNumber(45, 90);
	} else createCompBirdInterval--;
}

function CreateBlood(x, y, radius, color, amount) {
	for (let i = 0; i < amount; i++) {
		bloodArray.push(new Blood(x, y, radius, color));
	}
}

function CreateAddToPlayerStats(x, y, addToScore, addToKills) {
	addToPlayerStatsArray.push(new AddToPlayerStats(x, y, addToScore, addToKills));
}

function DisplayPlayerBullets(withBossBulletCollision, withCompBirdCollision) {
	loop1: for (let i = 0; i < playerBulletsArray.length; i++) {
		playerBulletsArray[i].Draw();

		//Collision logic between player bullet and player
		if (CircleRectangleCollision(playerBulletsArray[i], player)) {
			player.deathCause = 'FROM CRASHING INTO YOUR OWN BULLET';
			player.isDead = true;
		}

		//Collision logic between player bullet and boss bullet
		if (withBossBulletCollision) {
			for (let j = 0; j < bossBulletsArray.length; j++) {
				if (CircleCircleCollision(playerBulletsArray[i], bossBulletsArray[j])) {
					playerBulletsArray[i].dX = (playerBulletsArray[i].x - bossBulletsArray[j].x) * 0.3;
					playerBulletsArray[i].dY = (playerBulletsArray[i].y - bossBulletsArray[j].y) * 0.3;
					bossBulletsArray[j].PlayDeflectAudio();
				}
			}
		}

		//Collision logic between player bullet and comp bird
		if (withCompBirdCollision) {
			for (let j = 0; j < compBirdsArray.length; j++) {
				if (CircleRectangleCollision(playerBulletsArray[i], compBirdsArray[j])) {
					compBirdsArray[j].health--;
					compBirdsArray[j].PlayHitAudio();
					if (compBirdsArray[j].health > 0) {
						CreateBlood(compBirdsArray[j].x + 25, compBirdsArray[j].y + 30, GetRandomNumber(1.5, 2), 'red', 2);
						CreateBlood(compBirdsArray[j].x + 25, compBirdsArray[j].y + 30, GetRandomNumber(2, 3), 'rgb(0, 140, 255)', 2);
						if (compBirdsArray[j].y >= canvas.height * 0.08) CreateAddToPlayerStats(compBirdsArray[j].x, compBirdsArray[j].y - compBirdsArray[j].spriteHeight * 0.15, 50, 0);
						else CreateAddToPlayerStats(compBirdsArray[j].x, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 1.4, 50, 0);
					} else {
						//If player bullet kills comp bird
						CreateBlood(
							GetRandomNumber(compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.1, compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.9),
							GetRandomNumber(compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.1, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.9),
							GetRandomNumber(1.5, 2),
							'red',
							30
						);
						CreateBlood(
							GetRandomNumber(compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.1, compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.9),
							GetRandomNumber(compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.1, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.9),
							GetRandomNumber(3, 4),
							'pink',
							30
						);
						CreateBlood(
							GetRandomNumber(compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.1, compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.9),
							GetRandomNumber(compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.1, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.9),
							GetRandomNumber(2, 3),
							'rgb(0, 140, 255)',
							20
						);
						if (compBirdsArray[j].y >= canvas.height * 0.08) CreateAddToPlayerStats(compBirdsArray[j].x, compBirdsArray[j].y - compBirdsArray[j].spriteHeight * 0.15, 500, 1);
						else CreateAddToPlayerStats(compBirdsArray[j].x, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 1.4, 500, 1);
						compBirdsArray.splice(j, 1);
						j--;
					}
					playerBulletsArray.splice(i, 1);
					i--;
					continue loop1;
				}
			}
		}

		//Get rid of player bullet if it goes off canvas
		if (
			playerBulletsArray[i].x + playerBulletsArray[i].radius * 1.65 < 0 ||
			playerBulletsArray[i].x - playerBulletsArray[i].radius * 1.65 > canvas.width ||
			playerBulletsArray[i].y - playerBulletsArray[i].radius * 1.65 > canvas.height ||
			playerBulletsArray[i].y + playerBulletsArray[i].radius * 1.65 < 0
		) {
			playerBulletsArray.splice(i, 1);
			i--;
		}
	}
}

function DisplayBossBullets(withCompBirdCollision) {
	for (let i = 0; i < bossBulletsArray.length; i++) {
		bossBulletsArray[i].Draw();

		//Collision logic between boss bullet and player
		if (CircleRectangleCollision(bossBulletsArray[i], player)) {
			player.deathCause = 'FROM CRASHING INTO A BOSS BULLET';
			player.isDead = true;
		}

		//Collision logic between boss bullet and comp bird
		if (withCompBirdCollision) {
			for (let j = 0; j < compBirdsArray.length; j++) {
				if (CircleRectangleCollision(bossBulletsArray[i], compBirdsArray[j])) {
					compBirdsArray[j].PlayHitAudio();
					CreateBlood(
						GetRandomNumber(compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.1, compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.9),
						GetRandomNumber(compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.1, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.9),
						GetRandomNumber(1.5, 2),
						'red',
						30
					);
					CreateBlood(
						GetRandomNumber(compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.1, compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.9),
						GetRandomNumber(compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.1, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.9),
						GetRandomNumber(3, 4),
						'pink',
						30
					);
					CreateBlood(
						GetRandomNumber(compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.1, compBirdsArray[j].x + compBirdsArray[j].spriteWidth * 0.9),
						GetRandomNumber(compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.1, compBirdsArray[j].y + compBirdsArray[j].spriteHeight * 0.9),
						GetRandomNumber(2, 3),
						'rgb(0, 140, 255)',
						20
					);
					compBirdsArray.splice(j, 1);
					j--;
				}
			}
		}

		//Get rid of boss bullet if it goes off canvas
		if (
			bossBulletsArray[i].x + bossBulletsArray[i].radius * 1.65 < 0 ||
			bossBulletsArray[i].x - 100 > canvas.width ||
			bossBulletsArray[i].y - bossBulletsArray[i].radius * 1.65 > canvas.height ||
			bossBulletsArray[i].y + bossBulletsArray[i].radius * 1.65 < 0
		) {
			bossBulletsArray.splice(i, 1);
			i--;
		}
	}
}

function DisplayCompBirds() {
	for (let i = 0; i < compBirdsArray.length; i++) {
		compBirdsArray[i].Draw();

		//Collision logic between comp bird and player
		if (RectangleRectangleCollision(player, compBirdsArray[i])) {
			player.deathCause = 'FROM CRASHING INTO A BIRD';
			player.isDead = true;
		}

		//Get rid of comp bird if it goes off canvas
		if (compBirdsArray[i].x + compBirdsArray[i].spriteWidth < 0) {
			compBirdsArray.splice(i, 1);
			i--;
		}
	}
}

function DisplayBlood() {
	for (let i = 0; i < bloodArray.length; i++) {
		bloodArray[i].Draw();
		bloodArray[i].dY += 0.2;

		//Get rid of blood if it goes off canvas
		if (bloodArray[i].x + bloodArray[i].radius < 0 || bloodArray[i].y - bloodArray[i].radius > canvas.height) {
			bloodArray.splice(i, 1);
			i--;
		}
	}
}

function DisplayAddToPlayerStats() {
	for (let i = 0; i < addToPlayerStatsArray.length; i++) {
		addToPlayerStatsArray[i].Draw();

		if (addToPlayerStatsArray[i].aura == 0) {
			addToPlayerStatsArray.splice(i, 1);
			i--;
		}
	}
}

function LevelTracker() {
	if (boss.health < boss.phase3) currentLevel = 5;
	else if (boss.health < boss.phase2) currentLevel = 4;
	else if (stopWatch >= boss.phase1) currentLevel = 3;
	else if (stopWatch >= 840) currentLevel = 2;
	else currentLevel = 1;
}

function LevelMaker() {
	switch (currentLevel) {
		case 1:
			if (stopWatch == 700) boss.PlayDistantCryAudio();
			if (stopWatch > 100) CreateCompBird();
			CanvasBackground();
			player.Draw();
			DisplayBlood();
			DisplayPlayerBullets(false, true);
			DisplayCompBirds();
			DisplayAddToPlayerStats();
			player.DrawHUD();
			player.PlayWingAudio();
			break;
		case 2:
			CreateCompBird();
			CreateBossBullet(canvas.width + 100, GetRandomNumber(60, canvas.height - 60), 45, -8, 0, 1, 1, 2, 1, GetRandomNumber(90, 140));
			CanvasBackground();
			player.Draw();
			DisplayBlood();
			DisplayPlayerBullets(true, true);
			DisplayCompBirds();
			DisplayBossBullets(true);
			DisplayAddToPlayerStats();
			player.DrawHUD();
			player.PlayWingAudio();
			break;
		case 3:
			if (stopWatch == boss.phase1) boss.PlayCloseCryAudio();
			if (stopWatch > boss.phase1 + 240) CreateBossBullet(boss.x + 100, boss.y + 150, 45, -8, GetRandomNumber(-3.5, 3.5), 1, 1, 2, 2, GetRandomNumber(90, 140));
			CanvasBackground();
			player.Draw();
			DisplayBlood();
			DisplayPlayerBullets(true, true);
			DisplayCompBirds();
			DisplayBossBullets(true);
			boss.Draw();
			DisplayAddToPlayerStats();
			boss.DrawHealthBar();
			player.DrawHUD();
			player.PlayWingAudio();
			boss.PlayPhase1Audio();
			break;
		case 4:
			CreateBossBullet(boss.x + 120, boss.y + 160, null, null, null, 2, 2, null, 2, 140);
			CanvasBackground();
			player.Draw();
			DisplayBlood();
			DisplayPlayerBullets(true, false);
			DisplayBossBullets(false);
			boss.Draw();
			DisplayAddToPlayerStats();
			boss.DrawHealthBar();
			player.DrawHUD();
			player.PlayWingAudio();
			boss.PlayPhase2Audio();
			break;
		case 5:
			if (player.x > 0 && boss.postDeathTimer == boss.postDeathTimerInitial) player.x -= 3.6;
			for (let i = 0; i < bossBulletsArray.length - 1; i++) {
				bossBulletsArray[i].dX -= 0.01;
				if (bossBulletsArray[i].dY > 0 && bossBulletsArray[i].dY != 0) bossBulletsArray[i].dY -= 0.01;
				else if (bossBulletsArray[i].dY < 0 && bossBulletsArray[i].dY != 0) bossBulletsArray[i].dY += 0.01;
			}
			CreateBossBullet(-canvas.height - canvas.height * (1 / 2), canvas.height / 2, canvas.height, 0.825, 0, 1, 3, 5, null, 1200);
			CanvasBackground();
			player.Draw();
			DisplayBlood();
			DisplayPlayerBullets(true, false);
			DisplayBossBullets(false);
			boss.Draw();
			DisplayAddToPlayerStats();
			boss.DrawHealthBar();
			player.DrawHUD();
			player.PlayWingAudio();
			boss.PlayPhase3Audio();
			break;
	}
	if (canvasTransitionPosition > 0) CanvasTransition();
}

function Blur() {
	document.getElementById('startButton').blur();
	document.getElementById('audioButton').blur();
	document.getElementById('titleButton').blur();
}

function CanvasTitle() {
	brush.fillStyle = 'rgb(211, 254, 236)';
	brush.fillRect(0, 0, canvas.width, canvas.height);
	let canvasTitle = new Image();
	canvasTitle.src = 'img/canvasTitle.png';
	canvasTitle.onload = function () {
		brush.drawImage(canvasTitle, 0, 0);
	};
	canvasTransitionColor = 'rgb(211, 254, 236)';
}

function CanvasBackground() {
	brush.clearRect(0, 0, canvas.width, canvas.height);
	brush.drawImage(canvasBackground, canvasBackgroundX, canvasBackgroundY);
	canvasBackgroundX--;
	if (canvasBackgroundX <= -canvasBackground.width) canvasBackgroundX = 0;
	brush.drawImage(canvasBackground, canvasBackgroundX + canvasBackground.width, canvasBackgroundY);
}

function CanvasTransition() {
	brush.beginPath();
	brush.arc(canvas.width * 0.5, canvas.height * 0.5, canvasTransitionPosition, ToRadians(0), ToRadians(360));
	brush.closePath();
	brush.strokeStyle = 'black';
	brush.lineWidth = 4;
	brush.stroke();
	brush.fillStyle = canvasTransitionColor;
	brush.fill();

	//Player win transition
	if (boss.health > 0) canvasTransitionPosition -= 30;
	else {
		canvasTransitionColor = 'rgb(223, 252, 221)';
		canvasTransitionPosition += 25;
	}
}

function AudioButtonValue() {
	if (audioElement.value == '🔇') {
		audioElement.value = '🔊';
		audioElement.innerHTML = '🔊';
	} else {
		audioElement.value = '🔇';
		audioElement.innerHTML = '🔇';
	}
}

function AudioController() {
	let elements = document.querySelectorAll('audio');
	if (player.isDead || player.gotWin) {
		[].forEach.call(elements, function (elements) {
			elements.muted = true;
			elements.pause();
		});
	} else if (audioElement.value == '🔇') {
		[].forEach.call(elements, function (elements) {
			elements.muted = true;
		});
	} else {
		[].forEach.call(elements, function (elements) {
			elements.muted = false;
		});
	}
}

function NewGame() {
	document.getElementById('startButton').disabled = true;
	document.getElementById('titleButton').disabled = true;
	canvasBackgroundX = 0;
	canvasBackgroundY = 0;
	canvasTransitionPosition = 540;
	stopWatch = 0;
	createBossBulletInterval = GetRandomNumber(90, 140);
	createCompBirdInterval = GetRandomNumber(45, 90);
	player = new Player(canvas.width * 0.2, canvas.height * 0.5 - 25);
	boss = new Boss(canvas.width, canvas.height * 0.2);
	compBirdsArray = [];
	playerBulletsArray = [];
	bossBulletsArray = [];
	bloodArray = [];
	addToPlayerStatsArray = [];

	function Animate() {
		stopWatch++;
		LevelTracker();
		LevelMaker();
		AudioController();

		//Check if game on or game over
		if (!player.isDead && !player.gotWin) requestAnimationFrame(Animate);
		else {
			cancelAnimationFrame(refreshCanvas);
			GameResults();
			document.getElementById('startButton').disabled = false;
			document.getElementById('titleButton').disabled = false;
		}
	}
	refreshCanvas = requestAnimationFrame(Animate);
}

function GameResults() {
	//Unmute to play death or win audio
	let elements = document.querySelectorAll('audio');
	[].forEach.call(elements, function (elements) {
		elements.currentTime = 0;
		elements.muted = false;
	});

	brush.font = '30px Times New Roman';
	if (player.gotWin) {
		if (audioElement.value == '🔊') document.getElementById('winAudio').play();
		brush.fillStyle = 'rgb(223, 252, 221)';
		brush.fillRect(0, 0, canvas.width, canvas.height);
		brush.fillStyle = 'rgb(204, 172, 0)';
		let canvasWin = new Image();
		canvasWin.src = 'img/canvasWin.png';
		canvasWin.onload = function () {
			brush.drawImage(canvasWin, 0, 0);
			brush.textAlign = 'right';
			brush.fillText('Score  ', canvas.width * 0.315, canvas.height * 0.65);
			brush.fillText('Kills  ', canvas.width * 0.315, canvas.height * 0.77);
			brush.fillText('High Score  ', canvas.width * 0.315, canvas.height * 0.89);
			brush.textAlign = 'left';
			brush.fillText('  ' + player.score + ' PTS', canvas.width * 0.315, canvas.height * 0.65);
			brush.fillText('  ' + player.kills, canvas.width * 0.315, canvas.height * 0.77);
			if (player.score > parseInt(localStorage.getItem('highScore'))) localStorage.setItem('highScore', player.score.toString());
			brush.fillText('  ' + localStorage.getItem('highScore') + ' PTS', canvas.width * 0.315, canvas.height * 0.89);
		};
		canvasTransitionColor = 'rgb(223, 252, 221)';
	} else {
		if (audioElement.value == '🔊') document.getElementById('playerHitAudio').play();
		brush.fillStyle = 'red';
		brush.fillRect(0, 0, canvas.width, canvas.height);
		brush.fillStyle = 'rgb(236, 28, 36)';
		let canvasDefeat = new Image();
		canvasDefeat.src = 'img/canvasDefeat.png';
		canvasDefeat.onload = function () {
			brush.drawImage(canvasDefeat, 0, 0);
			brush.textAlign = 'center';
			brush.fillText(player.deathCause, canvas.width * 0.5, canvas.height * 0.52);
			brush.textAlign = 'right';
			brush.fillText('Score  ', canvas.width * 0.5, canvas.height * 0.67);
			brush.fillText('Kills  ', canvas.width * 0.5, canvas.height * 0.77);
			brush.fillText('High Score  ', canvas.width * 0.5, canvas.height * 0.87);
			brush.textAlign = 'left';
			brush.fillText('  ' + player.score + ' PTS', canvas.width * 0.5, canvas.height * 0.67);
			brush.fillText('  ' + player.kills, canvas.width * 0.5, canvas.height * 0.77);
			if (player.score > parseInt(localStorage.getItem('highScore'))) localStorage.setItem('highScore', player.score.toString());
			brush.fillText('  ' + localStorage.getItem('highScore') + ' PTS', canvas.width * 0.5, canvas.height * 0.87);
		};
		canvasTransitionColor = 'rgb(94, 0, 19)';
	}
}
