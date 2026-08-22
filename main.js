const buttons = document.querySelectorAll(".header__menu-button");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");

const canvas = document.getElementById("gifCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.imageSmoothingEnabled = false;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

let projectData = null;
const spriteCashe = {};

let lastTime = 0;

let cameraX = 0;
let cameraY = 0;
let currentZoom = 3.0;
let isDragging = false;
let startX = 0
let startY = 0;

async function loadingProjectData () {
    try {
        const response = await fetch("./data.json");

        if(!response.ok) {
            throw new Error(`Ошибка чтения файла ${response.status}`);
        }

        projectData = await response.json();

        initButton();

        const spriteList = projectData.SPRITES
        const loadPromises = [];

        for(const key in spriteList) {
            const character = spriteList[key];
            const img = new Image();

            img.src = character.src;

            character.currentFrame = 0;
            character.lastFrameTime = 0;

            spriteCashe[key] = img;

            const promise = new Promise(resolve => img.onload = resolve);
            loadPromises.push(promise);
        }

        await Promise.all(loadPromises);
        requestAnimationFrame(animate);

    } catch (error) {
        console.error("JSON файл не загрузился")
    }
}

function animate (timestamp) {
    if(!projectData || !projectData.SPRITES) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cameraX, cameraY);
    ctx.scale(currentZoom, currentZoom);
    ctx.imageSmoothingEnabled = false;
    
    const spritesList = projectData.SPRITES;
    
    for(const key in spritesList) {
        const character = spritesList[key];
        const spriteImage = spriteCashe[key];
        
        const frameInterval = 1000 / character.fps;
        
        if(timestamp - character.lastFrameTime >= frameInterval) {
            character.currentFrame = (character.currentFrame + 1) % character.totalFrames;
            character.lastFrameTime = timestamp;
        }
        
        const sourseX = character.currentFrame * character.frameWidth;
        
        ctx.drawImage (
            spriteImage,
            sourseX, 0, character.frameWidth, character.frameHeight,
            character.x, character.y, character.frameWidth, character.frameHeight
        );

    }

    ctx.restore();
    
    requestAnimationFrame(animate);
    
}

function initButton () {
    buttons.forEach(btn => {
        btn.addEventListener("click", (event) => {
            const projectKey = event.currentTarget.dataset.project;

            if(projectKey && projectData[projectKey]) {
                const data = projectData[projectKey];

                modalTitle.textContent = data.title;
                modalDescription.textContent = data.description;

                modal.classList.add('open');
                document.body.classList.add("lock");
            }
        })
    });
}

document.getElementById("closeBtn").addEventListener("click", () => {
    modal.classList.remove("open");
    document.body.classList.remove("lock")
});

modal.addEventListener("click", (event) => {
    if(event.target === modal) {
        modal.classList.remove("open");
    }
});

canvas.addEventListener("mousedown", (event) => {
    isDragging = true;

    startX = event.clientX - cameraX;
    startY = event.clientY - cameraY;
});
window.addEventListener("mousemove", (event) => {
    if(isDragging === false) return;

    cameraX = event.clientX - startX;
    cameraY = event.clientY - startY;
});
window.addEventListener("mouseup", () => {
    isDragging = false;
});
window.addEventListener("wheel", (event) => {
    event.preventDefault();

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const canvasX = (mouseX - cameraX) / currentZoom;
    const canvasY = (mouseY - cameraY) / currentZoom;

    const oldZoom = currentZoom;

    if(event.deltaY < 0) {
        currentZoom += 0.5;
    } else {
        currentZoom -= 0.5;
    }

    currentZoom = Math.min(10.0, Math.max(0.5, currentZoom));

    cameraX = mouseX - canvasX * currentZoom;
    cameraY = mouseY - canvasY * currentZoom;

}, { passive: false });

loadingProjectData();