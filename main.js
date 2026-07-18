const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");

const canvas = document.getElementById("gifCanvas");
const ctx = canvas.getContext("2d");

let projectData = null;
const spriteCashe = {};
let lastTime = 0;

const camera = {
    x : 0,
    y : 0,
    zoom : 3.0,
    isDragging : false,
    startX : 0,
    startY : 0,
    minZoom : 0.5,
    maxZoom : 10.0
}

function handleWindowResize () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.imageSmoothingEnabled = false;
}

handleWindowResize();
window.addEventListener("resize", handleWindowResize);

async function loadingProjectData () {
    try {
        const response = await fetch("./data.json");

        if(!response.ok) {
            throw new Error(`Ошибка чтения файла ${response.status}`);
        }

        projectData = await response.json();

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
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);
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

document.addEventListener("click", (event) => {
    const target = event.target;

    if(target.classList.contains("header__menu-button")) {
        const projectKey = target.dataset.project;

        if(projectKey && projectData[projectKey]) {
            const data = projectData[projectKey];

            modalTitle.textContent = data.title;
            modalDescription.textContent = data.description;

            modal.classList.add('open');
            document.body.classList.add("lock");
        }
    }

    if(target.id === 'closeBtn' || target === modal) {
        modal.classList.remove("open");
        document.body.classList.remove("lock")
    }
})

function initCameraEvents () {
    canvas.addEventListener("mousedown", (event) => {
        camera.isDragging = true;
    
        camera.startX = event.clientX - camera.x;
        camera.startY = event.clientY - camera.y;
    });

    window.addEventListener("mousemove", (event) => {
        if(camera.isDragging === false) return;
    
        camera.x = event.clientX - camera.startX;
        camera.y = event.clientY - camera.startY;
    });

    window.addEventListener("mouseup", () => {
        camera.isDragging = false;
    });

    window.addEventListener("wheel", (event) => {
        if(modal.classList.contains("open")) return;
        // event.preventDefault();
    
        const mouseX = event.clientX;
        const mouseY = event.clientY;
    
        const canvasX = (mouseX - camera.x) / camera.zoom;
        const canvasY = (mouseY - camera.y) / camera.zoom;
    
        const oldZoom = camera.zoom;
    
        if(event.deltaY < 0) {
            camera.zoom += 0.5;
        } else {
            camera.zoom -= 0.5;
        }
    
        camera.zoom = Math.min(camera.maxZoom, Math.max(camera.minZoom, camera.zoom));
    
        camera.x = mouseX - canvasX * camera.zoom;
        camera.y = mouseY - canvasY * camera.zoom;
    
    }, { passive: false });
}

initCameraEvents();
loadingProjectData();