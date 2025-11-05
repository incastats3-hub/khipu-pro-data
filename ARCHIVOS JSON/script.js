// --- ============================================ ---
// --- KHIPU PRO 1.0 - SCRIPT OPTIMIZADO ---
// --- ============================================ ---

// --- ============================================ ---
// --- CONFIGURACIÓN DE API (¡NO PONER EN PRODUCCIÓN!) ---
// --- ============================================ ---

// Esto solo funcionará temporalmente. La única solución real
// es mover la llamada a la API a un backend (servidor).
const GEMINI_API_KEY = "AIzaSyDRrZ_DcGcRERwFulFZvgR5sK6MzOUYhxw"; // ¡RECUERDA CAMBIAR ESTO Y MOVERLO AL BACKEND!
const GEMINI_API_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";


// --- SISTEMA DE NOTIFICACIONES ---
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    toast.getBoundingClientRect();
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, { once: true });
    }, duration);
}

// --- STATE MANAGEMENT & PERSISTENCE ---
let APP_STATE = { database: {}, currentMatch: null, selectedHome: null, selectedAway: null, activePage: 'selector', history: [], historyLimit: 30, analysisGenerated: false, currentLeagueType: null };
let activePasteTarget = null;

// --- OBJETOS DE CONFIGURACIÓN GLOBAL ---
const leagueThemes = {
    premier: [
        { id: 'premier-30', name: 'Premier League 30 Años', gradient: 'linear-gradient(45deg, #ff4a4a, #8a2be2)' },
        { id: 'premier-league', name: 'Premier League', gradient: 'linear-gradient(45deg, #310038, #450c4c)' },
        { id: 'inca-light', name: 'Inca Light', gradient: 'linear-gradient(45deg, #FDFEFA, #F1F5F9)', border: '1px solid #E2E8F0' }
    ],
    laliga: [
        { id: 'laliga-easports-light', name: 'La Liga EA (Light)', gradient: 'linear-gradient(45deg, #F0F2F5, #FFFFFF)', border: '1px solid #E2E8F0' },
        { id: 'laliga-easports-dark', name: 'La Liga EA (Dark)', gradient: 'linear-gradient(45deg, #F9423A, #1d1d1d)' }
    ],
    bundesliga: [
        { id: 'der-klassiker', name: 'Der Klassiker', gradient: 'linear-gradient(45deg, #D20515, #000000)' },
        { id: 'meisterschale', name: 'Meisterschale', gradient: 'linear-gradient(45deg, #E8E8E8, #B0B0B0)', border: '1px solid #A9A9A9' }
    ],
    ligue1: [
        { id: 'ligue1-light', name: 'Ligue 1 Light', gradient: 'linear-gradient(45deg, #0052FF, #E2E8F0)', border: '1px solid #0052FF' },
        { id: 'ligue1-dark', name: 'Ligue 1 Dark', gradient: 'linear-gradient(45deg, #0052FF, #27272A)' }
    ],
    seriea: [
        { id: 'scudetto', name: 'Scudetto', gradient: 'linear-gradient(45deg, #008C45, #FFFFFF, #CD212A)', border: '1px solid #0055A4' },
        { id: 'calcio-storico', name: 'Calcio Storico', gradient: 'linear-gradient(45deg, #E3DACE, #B3A394)', border: '1px solid #6B4F35' }
    ],
    champions: [
        { id: 'champions-night', name: 'Noche de Champions', gradient: 'linear-gradient(45deg, #051C3F, #0A2A5B)', border: '1px solid #00FFFF' },
        { id: 'final-aura', name: 'Aura de Final', gradient: 'linear-gradient(145deg, #060d2e, #101c4c)', border: '1px solid #C0C0D2' },
        { id: 'aurora-night', name: 'Noche de Aurora', gradient: 'linear-gradient(45deg, #E3559E, #5A78F0)', border: '1px solid #29F4FF' }
    ],
    europa: [
        { id: 'europa-orange', name: 'Naranja Europa', gradient: 'linear-gradient(45deg, #F47920, #222222)' },
        { id: 'silver-finish', name: 'Final de Plata', gradient: 'linear-gradient(45deg, #333333, #1a1a1a)', border: '1px solid #F47920' }
    ]
};

const leagueSlogans = {
    premier: "The Best League in the World.",
    laliga: "No es Fútbol, es LaLiga.",
    bundesliga: "Football As It's Meant To Be.",
    ligue1: "La Ligue des Talents.",
    seriea: "Il Calcio è di chi lo ama.",
    champions: "Noches Mágicas de Champions.",
    europa: "This is Europa."
};


function saveFullAppState() {
    try {
        const stateToSave = { database: APP_STATE.database, currentMatch: APP_STATE.currentMatch, selectedHome: APP_STATE.selectedHome, selectedAway: APP_STATE.selectedAway, activePage: APP_STATE.activePage, analysisGenerated: APP_STATE.analysisGenerated, currentLeagueType: APP_STATE.currentLeagueType };
        localStorage.setItem('khipuProState', JSON.stringify(stateToSave));
    } catch (e) {
        console.error("Error al guardar el estado de la aplicación:", e);
        showToast("Error al guardar la sesión.", "error");
    }
}

function loadFullAppState() {
    try {
        const savedStateJSON = localStorage.getItem('khipuProState');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            APP_STATE.database = savedState.database || {};
            APP_STATE.currentMatch = savedState.currentMatch || null;
            APP_STATE.selectedHome = savedState.selectedHome || null;
            APP_STATE.selectedAway = savedState.selectedAway || null;
            APP_STATE.activePage = savedState.activePage || 'selector';
            APP_STATE.analysisGenerated = savedState.analysisGenerated || false;
            APP_STATE.currentLeagueType = savedState.currentLeagueType || null;

            if (APP_STATE.activePage === 'analysis' && APP_STATE.currentMatch) {
                const league = leagues.find(l => l.type === APP_STATE.currentLeagueType) || leagues[0];
                showAnalysisPanel(league);
                const mainContainer = document.getElementById('main-app-container');
                const template = document.getElementById('main-content-template');
                mainContainer.innerHTML = '';
                mainContainer.appendChild(template.content.cloneNode(true));
                renderAll(APP_STATE.currentMatch);
                document.getElementById('file-importer-modal').classList.add('hidden');
                document.getElementById('team-selection-modal').classList.add('hidden');
                mainContainer.classList.remove('hidden');
                mainContainer.classList.add('flex');
            } else if (APP_STATE.activePage === 'team-selection' && Object.keys(APP_STATE.database).length > 0) {
                const league = leagues.find(l => l.type === APP_STATE.currentLeagueType) || leagues[0];
                showAnalysisPanel(league);
                document.getElementById('file-importer-modal').classList.add('hidden');
                showTeamSelector();
            }
        }
    } catch (e) {
        console.error("Error al cargar el estado de la aplicación, iniciando de cero:", e);
        localStorage.removeItem('khipuProState');
    }
}

// --- GESTIÓN DE TEMAS ---
function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('selectedTheme', themeName);
    document.querySelectorAll('#analysis-settings-container .theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}
(function initializeTheme() { applyTheme(localStorage.getItem('selectedTheme') || 'premier-30'); })();

const mainThemeSubtitles = { "inca-pro": "Análisis de Precisión. Tecnología de Élite.", "match-day": "El Rugido del Estadio. La Gloria en el Campo.", "gala-night": "Donde Nacen las Leyendas. Noche de Trofeos.", "pre-game": "La Calma Antes de la Batalla. El Momento es Ahora.", "champions-aura": "Forjado en la Victoria. Destinado a la Grandeza." };
function applyMainTheme(themeName) {
    const pageSelector = document.getElementById('page-selector');
    const subtitleEl = document.getElementById('main-subtitle');
    if (pageSelector) { pageSelector.setAttribute('data-main-theme', themeName); localStorage.setItem('selectedMainTheme', themeName); }
    if (subtitleEl && mainThemeSubtitles[themeName]) { subtitleEl.textContent = mainThemeSubtitles[themeName]; }
}
(function initializeMainTheme() { applyMainTheme(localStorage.getItem('selectedMainTheme') || 'inca-pro'); })();

// --- LÓGICA DE NAVEGACIÓN Y CARGA DE PÁGINAS ---
const pageSelector = document.getElementById('page-selector');
const pageAnalysis = document.getElementById('page-analysis');

function showAnalysisPanel(league) {
    pageSelector.classList.add('hidden');
    pageAnalysis.classList.remove('hidden');
    document.body.classList.add('analysis-active');
    APP_STATE.currentLeagueType = league.type;
    saveFullAppState();
    const importerTitle = pageAnalysis.querySelector('#importer-title');
    if (importerTitle) importerTitle.textContent = `Cargar Configuración de ${league.name}`;
    const classicsCard = document.getElementById('card-classics-file');
    if (classicsCard) classicsCard.classList.toggle('hidden', league.type === 'champions' || league.type === 'europa');
    const themeButtonsContainer = document.querySelector('#analysis-theme-panel .flex.gap-2');
    const themes = leagueThemes[league.type] || leagueThemes.premier;
    themeButtonsContainer.innerHTML = '';
    themes.forEach(theme => {
        const button = document.createElement('button');
        button.className = 'theme-btn';
        button.dataset.theme = theme.id;
        button.title = theme.name;
        const span = document.createElement('span');
        span.style.cssText = `display: block; width: 20px; height: 20px; border-radius: 50%; background: ${theme.gradient}; border: ${theme.border || 'none'};`;
        button.appendChild(span);
        button.addEventListener('click', () => applyTheme(theme.id));
        themeButtonsContainer.appendChild(button);
    });
    applyTheme(themes[0].id);
}

function initializeSelectorPage() {
    const toggleBtn = document.getElementById('main-settings-toggle-btn');
    const settingsPanel = document.getElementById('main-settings-panel');
    if (toggleBtn && settingsPanel) {
        toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsPanel.classList.toggle('is-open'); });
        document.addEventListener('click', (e) => { if (settingsPanel.classList.contains('is-open') && !e.target.closest('#main-settings-panel')) settingsPanel.classList.remove('is-open'); });
    }
    document.querySelectorAll('.theme-preview-btn').forEach(button => button.addEventListener('click', () => applyMainTheme(button.dataset.mainTheme)));
    const leagueGrid = document.getElementById('league-grid');
    if (leagueGrid) {
        leagueGrid.innerHTML = '';
        leagues.forEach(league => {
            const card = document.createElement('div');
            card.className = 'league-card rounded-lg p-4 flex flex-col items-center justify-center aspect-square text-center';
            card.innerHTML = `<img src="${league.logo}" alt="${league.name}" class="w-16 h-16 object-contain mb-3" onerror="this.src='https://placehold.co/64x64/2a3c38/f0e6d2?text=?'; this.onerror=null;"><h3 class="font-semibold text-sm">${league.name}</h3><p class="text-xs">${league.country}</p>`;
            card.addEventListener('click', () => league.isKhipuEnabled ? showAnalysisPanel(league) : showToast(`El panel para "${league.name}" no está disponible.`, "info"));
            leagueGrid.appendChild(card);
        });
    }
}

const leagues = [
    { name: 'Premier League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png', country: 'Inglaterra', isKhipuEnabled: true, type: 'premier' },
    { name: 'La Liga', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png', country: 'España', isKhipuEnabled: true, type: 'laliga' },
    { name: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/1024px-Bundesliga_logo_%282017%29.svg.png', country: 'Alemania', isKhipuEnabled: true, type: 'bundesliga' },
    { name: 'Ligue 1', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Ligue_1_2024_Logo.png', country: 'Francia', isKhipuEnabled: true, type: 'ligue1' },
    { name: 'Serie A', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png', country: 'Italia', isKhipuEnabled: true, type: 'seriea' },
    { name: 'Champions League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png', country: 'Europa', isKhipuEnabled: true, type: 'champions' },
    { name: 'Europa League', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/UEFA_Europa_League_logo_%282024_version%29.svg/960px-UEFA_Europa_League_logo_%282024_version%29.svg.png', country: 'Europa', isKhipuEnabled: true, type: 'europa' }
];

// --- ============================================ ---
// --- LÓGICA PARA EL PANEL DE ANÁLISIS (KHIPU PRO) ---
// --- ============================================ ---

let uploadedOddsImages = [];

const positionCoords = {
    '4-3-3':      { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MC_D: {x:55,y:75}, MCD: {x:55,y:50}, MC_I: {x:55,y:25}, ED: {x:85,y:90}, DC: {x:85,y:50}, EI: {x:85,y:10} },
    '4-4-2':      { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MD: {x:55,y:88}, MC_D: {x:55,y:63}, MC_I: {x:55,y:37}, MI: {x:55,y:12}, DC_D: {x:85,y:65}, DC_I: {x:85,y:35} },
    '4-2-3-1':    { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MCD_D: {x:50,y:65}, MCD_I: {x:50,y:35}, VOL_D: {x:70,y:90}, MCO: {x:70,y:50}, VOL_I: {x:70,y:10}, DC: {x:90,y:50} },
    '3-5-2':      { POR: {x:5,y:50}, DFC_D: {x:25,y:80}, DFC_C: {x:25,y:50}, DFC_I: {x:25,y:20}, CAR_D: {x:55,y:92}, MC_D: {x:55,y:70}, MC_C: {x:55,y:50}, MC_I: {x:55,y:30}, CAR_I: {x:55,y:8}, DC_D: {x:85,y:65}, DC_I: {x:85,y:35} },
    '3-4-3':      { POR: {x:5,y:50}, DFC_D: {x:25,y:80}, DFC_C: {x:25,y:50}, DFC_I: {x:25,y:20}, MD: {x:50,y:90}, MC_D: {x:50,y:65}, MC_I: {x:50,y:35}, MI: {x:50,y:10}, ED: {x:85,y:85}, DC: {x:85,y:50}, EI: {x:85,y:15} },
    '3-4-2-1':    { POR: {x:5,y:50}, DFC_D: {x:25,y:80}, DFC_C: {x:25,y:50}, DFC_I: {x:25,y:20}, MD: {x:55,y:90}, MC_D: {x:55,y:65}, MC_I: {x:55,y:35}, MI: {x:55,y:10}, MCO_D: {x:75,y:65}, MCO_I: {x:75,y:35}, DC: {x:90,y:50} },
    '4-1-4-1':    { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MCD: {x:45,y:50}, MD: {x:65,y:90}, MC_D: {x:65,y:65}, MC_I: {x:65,y:35}, MI: {x:65,y:10}, DC: {x:88,y:50} },
    '5-3-2':      { POR: {x:5,y:50}, DFC_I: {x:25,y:20}, DFC_C: {x:25,y:50}, DFC_D: {x:25,y:80}, CAR_I: {x:55,y:15}, CAR_D: {x:55,y:85}, MC_I: {x:55,y:35}, MC_C: {x:55,y:50}, MC_D: {x:55,y:65}, DC_I: {x:85,y:35}, DC_D: {x:85,y:65} },
    '3-2-4-1':    { POR: {x:5,y:50}, DFC_D: {x:25,y:80}, DFC_C: {x:25,y:50}, DFC_I: {x:25,y:20}, MC_D: {x:45,y:65}, MC_I: {x:45,y:35}, MD: {x:65,y:90}, MCO_D: {x:65,y:65}, MCO_I: {x:65,y:35}, MI: {x:65,y:10}, DC: {x:90,y:50} },
    '4-5-1':      { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MD: {x:50,y:90}, MC_D: {x:50,y:70}, MC_C: {x:50,y:50}, MC_I: {x:50,y:30}, MI: {x:50,y:10}, DC: {x:85,y:50} },
    '4-3-2-1':    { POR: {x:5,y:50}, LTD: {x:25,y:88}, DFC_D: {x:25,y:65}, DFC_I: {x:25,y:35}, LTI: {x:25,y:12}, MC_D: {x:50,y:70}, MC_C: {x:50,y:50}, MC_I: {x:50,y:30}, MCO_D: {x:70,y:65}, MCO_I: {x:70,y:35}, DC: {x:88,y:50} },
    '4-1-3-2':    { POR: {x:5,y:50}, LTD: {x:25,y:88}, DFC_D: {x:25,y:65}, DFC_I: {x:25,y:35}, LTI: {x:25,y:12}, MCD: {x:45,y:50}, MD: {x:65,y:80}, MCO: {x:65,y:50}, MI: {x:65,y:20}, DC_D: {x:88,y:65}, DC_I: {x:88,y:35} },
    '5-4-1':      { POR: {x:5,y:50}, CAR_D: {x:25,y:90}, DFC_D: {x:25,y:70}, DFC_C: {x:25,y:50}, DFC_I: {x:25,y:30}, CAR_I: {x:25,y:10}, MD: {x:55,y:88}, MC_D: {x:55,y:63}, MC_I: {x:55,y:37}, MI: {x:55,y:12}, DC: {x:85,y:50} },
    '4-1-2-1-2':  { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MCD: {x:45,y:50}, MD: {x:60,y:75}, MI: {x:60,y:25}, MCO: {x:75,y:50}, DC_D: {x:90,y:65}, DC_I: {x:90,y:35} },
    '4-2-4':      { POR: {x:5,y:50}, LTD: {x:25,y:85}, DFC_D: {x:25,y:63}, DFC_I: {x:25,y:37}, LTI: {x:25,y:15}, MC_D: {x:50,y:65}, MC_I: {x:50,y:35}, ED: {x:85,y:90}, DC_D: {x:85,y:65}, DC_I: {x:85,y:35}, EI: {x:85,y:10} },
    '2-3-5':      { POR: {x:5,y:50}, DFC_D: {x:20,y:70}, DFC_I: {x:20,y:30}, LD: {x:40,y:80}, MC: {x:40,y:50}, LI: {x:40,y:20}, ED: {x:75,y:92}, ID: {x:75,y:70}, DC: {x:75,y:50}, II: {x:75,y:30}, EI: {x:75,y:8} },
    'WM (3-2-2-3)':{ POR: {x:5,y:50}, DFC_D: {x:25,y:80}, DFC_C: {x:25,y:50}, DFC_I: {x:25,y:20}, MD_D: {x:45,y:70}, MD_I: {x:45,y:30}, ID: {x:65,y:70}, II: {x:65,y:30}, ED: {x:85,y:80}, DC: {x:85,y:50}, EI: {x:85,y:20} },
    '2-3-2-3':    { POR: {x:5,y:50}, DFC_D: {x:20,y:70}, DFC_I: {x:20,y:30}, LD: {x:40,y:80}, MC: {x:40,y:50}, LI: {x:40,y:20}, ID: {x:65,y:70}, II: {x:65,y:30}, ED: {x:85,y:80}, DC: {x:85,y:50}, EI: {x:85,y:20} }
};

const formationMap = {
    '4-4-2': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:55,y:88},{x:55,y:63},{x:55,y:37},{x:55,y:12},{x:85,y:65},{x:85,y:35} ],
    '4-5-1': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:50,y:90},{x:50,y:70},{x:50,y:50},{x:50,y:30},{x:50,y:10},{x:85,y:50} ],
    '4-3-3': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:55,y:75},{x:55,y:50},{x:55,y:25},{x:85,y:90},{x:85,y:50},{x:85,y:10} ],
    '4-3-2-1': [ {x:5,y:50},{x:25,y:88},{x:25,y:65},{x:25,y:35},{x:25,y:12},{x:50,y:70},{x:50,y:50},{x:50,y:30},{x:70,y:65},{x:70,y:35},{x:88,y:50} ],
    '4-1-3-2': [ {x:5,y:50},{x:25,y:88},{x:25,y:65},{x:25,y:35},{x:25,y:12},{x:45,y:50},{x:65,y:80},{x:65,y:50},{x:65,y:20},{x:88,y:65},{x:88,y:35} ],
    '5-4-1': [ {x:5,y:50},{x:25,y:90},{x:25,y:70},{x:25,y:50},{x:25,y:30},{x:25,y:10},{x:55,y:88},{x:55,y:63},{x:55,y:37},{x:55,y:12},{x:85,y:50} ],
    '4-1-2-1-2': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:45,y:50},{x:60,y:75},{x:60,y:25},{x:75,y:50},{x:90,y:65},{x:90,y:35} ],
    '3-5-2': [ {x:5,y:50},{x:25,y:80},{x:25,y:50},{x:25,y:20},{x:55,y:92},{x:55,y:70},{x:55,y:50},{x:55,y:30},{x:55,y:8},{x:85,y:65},{x:85,y:35} ],
    '5-3-2': [ {x:5,y:50},{x:25,y:92},{x:25,y:70},{x:25,y:50},{x:25,y:30},{x:25,y:8},{x:55,y:75},{x:55,y:50},{x:55,y:25},{x:85,y:65},{x:85,y:35} ],
    '4-2-3-1': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:50,y:65},{x:50,y:35},{x:70,y:90},{x:70,y:50},{x:70,y:10},{x:90,y:50} ],
    '3-2-4-1': [ {x:5,y:50},{x:25,y:80},{x:25,y:50},{x:25,y:20},{x:45,y:65},{x:45,y:35},{x:65,y:90},{x:65,y:65},{x:65,y:35},{x:65,y:10},{x:90,y:50} ],
    '2-3-5': [ {x:5,y:50},{x:20,y:70},{x:20,y:30},{x:40,y:80},{x:40,y:50},{x:40,y:20},{x:75,y:92},{x:75,y:70},{x:75,y:50},{x:75,y:30},{x:75,y:8} ],
    'WM (3-2-2-3)': [ {x:5,y:50},{x:25,y:80},{x:25,y:50},{x:25,y:20},{x:45,y:70},{x:45,y:30},{x:65,y:70},{x:65,y:30},{x:85,y:80},{x:85,y:50},{x:85,y:20} ],
    '2-3-2-3': [ {x:5,y:50},{x:20,y:70},{x:20,y:30},{x:40,y:80},{x:40,y:50},{x:40,y:20},{x:65,y:70},{x:65,y:30},{x:85,y:80},{x:85,y:50},{x:85,y:20} ],
    '4-2-4': [ {x:5,y:50},{x:25,y:85},{x:25,y:63},{x:25,y:37},{x:25,y:15},{x:50,y:65},{x:50,y:35},{x:85,y:90},{x:85,y:65},{x:85,y:35},{x:85,y:10} ],
    '3-4-3': [ {x:5,y:50}, {x:25,y:80}, {x:25,y:50}, {x:25,y:20}, {x:50,y:90}, {x:50,y:65}, {x:50,y:35}, {x:50,y:10}, {x:85,y:85}, {x:85,y:50}, {x:85,y:15} ],
    '3-4-2-1': [ {x:5,y:50}, {x:25,y:80}, {x:25,y:50}, {x:25,y:20}, {x:55,y:90}, {x:55,y:65}, {x:55,y:35}, {x:55,y:10}, {x:75,y:65}, {x:75,y:35}, {x:90,y:50} ],
    '4-1-4-1': [ {x:5,y:50}, {x:25,y:85}, {x:25,y:63}, {x:25,y:37}, {x:25,y:15}, {x:45,y:50}, {x:65,y:90}, {x:65,y:65}, {x:65,y:35}, {x:65,y:10}, {x:88,y:50} ]
};

let draggedPlayer = null, editedPlayer = null, currentEditorTeam = null, playerToSubstitute = null;

// --- UTILITY FUNCTIONS ---
const _ = {
    get: (obj, path, defaultValue) => {
        const keys = Array.isArray(path) ? path : path.split('.');
        let result = obj;
        for (const key of keys) {
            result = result?.[key];
            if (result === undefined) return defaultValue;
        }
        return result;
    },
    cloneDeep: (obj) => JSON.parse(JSON.stringify(obj))
};


// --- LÓGICA DE ALINEACIONES (NUEVA VERSIÓN)---
function generateStartingLineup(teamName, presetName) {
    const teamData = _.get(APP_STATE, ['database', 'players', teamName], {});
    const allPlayers = teamData.plantilla || [];
    const preset = _.get(teamData, ['tactics', 'presets', presetName], null);

    if (!preset) {
        const genericLineup = (allPlayers || []).slice(0, 11);
        if (genericLineup.length < 11) {
             console.error(`Alineación genérica incompleta para ${teamName}`);
        }
        return genericLineup.map(player => ({ ...player, coords: {x: 25, y: 50} }));
    }

    const formation = preset.formation;
    const lineupData = preset.lineup;
    const formationCoords = positionCoords[formation];

    if (!formationCoords) {
        showToast(`Coordenadas para la formación "${formation}" no definidas.`, 'error');
        return [];
    }
    
    const lineup = Object.keys(lineupData).map(positionKey => {
        const playerName = lineupData[positionKey];
        const playerData = allPlayers.find(p => p.name === playerName);
        const coords = formationCoords[positionKey] || {x: 25, y: 50};

        if (!playerData) {
            console.warn(`Jugador "${playerName}" no encontrado en la plantilla de ${teamName}.`);
            return null;
        }
        
        return { ...playerData, position_key: positionKey, coords };
    }).filter(Boolean);

    return lineup;
}

// --- CORE RENDERING AND UI LOGIC ---
function hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function areColorsSimilar(hex1, hex2, threshold = 100) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return false;
    const distance = Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
    return distance < threshold;
}

// --- FUNCIÓN renderStaticData ACTUALIZADA ---
function renderStaticData(container, data) {
    const leagueNameElement = container.querySelector('#league-subtitle');
    const sloganEl = container.querySelector('#league-slogan');
    const dynamicLogoEl = container.querySelector('#dynamic-league-logo'); 
    const uploadedLogoEl = container.querySelector('#uploaded-league-logo'); 
    const defaultLogoEl = container.querySelector('#default-league-logo'); // <<< Referencia al SVG

    // 1. Obtener la información de la liga actual
    const currentLeague = leagues.find(l => l.type === APP_STATE.currentLeagueType);
    const leagueDisplayName = currentLeague ? currentLeague.name.toUpperCase() : 'LIGA LOCAL';
    const leagueLogoUrl = currentLeague ? currentLeague.logo : ''; 
    const slogan = leagueSlogans[APP_STATE.currentLeagueType] || '"Análisis Khipu Pro"'; 

    // 2. Actualizar subtítulo y slogan
    if (leagueNameElement) leagueNameElement.textContent = `${leagueDisplayName} // DATA: INCA STATS`;
    if (sloganEl) sloganEl.textContent = slogan;

    // 3. Actualizar el logo de la liga en la cabecera (CORREGIDO)
    if (dynamicLogoEl && defaultLogoEl) { // Asegurarse que ambos existen
        if (leagueLogoUrl) {
            // Si hay URL de logo de liga (ej. Serie A)
            dynamicLogoEl.src = leagueLogoUrl;
            dynamicLogoEl.alt = leagueDisplayName;
            dynamicLogoEl.classList.remove('hidden'); // MUESTRA el logo de la liga
            defaultLogoEl.classList.add('hidden');    // OCULTA el logo SVG por defecto
        } else {
            // Si NO hay URL de logo de liga
            dynamicLogoEl.classList.add('hidden');    // OCULTA el logo de la liga (img)
            defaultLogoEl.classList.remove('hidden'); // MUESTRA el logo SVG por defecto
        }
        // Asegurarse de que el logo subido (ya inactivo) esté siempre oculto
        if (uploadedLogoEl) {
             uploadedLogoEl.classList.add('hidden');
        }
    }


    // 4. Actualizar el resto de datos (título del partido, logos de equipos, etc.) - Sin cambios aquí
    container.querySelector('#match-title').textContent = `${data.homeTeam.name} vs ${data.awayTeam.name}`;
    container.querySelector('#pick-title').textContent = data.pick.market.toUpperCase();
    container.querySelector('#pick-logo-home').src = data.homeTeam.logoUrl;
    container.querySelector('#pick-logo-away').src = data.awayTeam.logoUrl;
    container.querySelector('#metrics-logo-home').src = data.homeTeam.logoUrl;
    container.querySelector('#metrics-logo-away').src = data.awayTeam.logoUrl;
}
// --- FIN FUNCIÓN renderStaticData ACTUALIZADA ---


function renderFundamentals(container, items) {
    const fundamentalsContainer = container.querySelector('#fundamentals-container');
    fundamentalsContainer.innerHTML = '';
    const icons = [ '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-accent-green flex-shrink-0"><path d="m12 3-1.41 1.41L16.17 10H4v4h12.17l-5.58 5.59L12 21l8-8-8-8z"/></svg>', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-accent-green flex-shrink-0"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>' ];
    (items || []).forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'flex items-start gap-3';
        el.innerHTML = `${icons[index % icons.length]}<div><h4 class="font-bold text-sm" style="color: var(--text-primary);">${item.title}</h4><p class="text-xs" style="color: var(--text-secondary);">${item.desc}</p></div>`;
        fundamentalsContainer.appendChild(el);
    });
}

function renderKeyPlayers(container, data) {
    const keyPlayersContainer = container.querySelector('#key-players-container');
    keyPlayersContainer.innerHTML = '';
    ['home', 'away'].forEach(type => {
        const player = _.get(data, `keyPlayers.${type}`, null);
        const card = document.createElement('div');
        card.className = 'relative rounded-lg overflow-hidden h-full text-white shadow-lg group';

        if (!player || !player.name) {
            card.innerHTML = `<div class="relative rounded-lg h-full text-white/50 flex items-center justify-center bg-black/20"><p class="text-sm">Protagonista no definido</p></div>`;
        } else {
            const teamData = APP_STATE.database.teams[type === 'home' ? APP_STATE.currentMatch.home : APP_STATE.currentMatch.away];
            const jerseyColor = teamData ? teamData.jerseyColor : '#cccccc';

            const playerImageHTML = player.photoUrl
                ? `<div class="absolute inset-0 bg-cover transition-transform duration-300 ease-in-out group-hover:scale-105" style="background-image: url('${player.photoUrl}'); background-position: center 20%;"></div>`
                : `<div class="player-silhouette" style="--jersey-color: ${jerseyColor};">
                     <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet"><path d="M50,15 C40,15 35,25 35,35 C35,45 40,55 50,55 C60,55 65,45 65,35 C65,25 60,15 50,15z M20,60 L80,60 L80,90 L65,90 L65,75 L35,75 L35,90 L20,90z" fill="currentColor"></path></svg>
                   </div>`;
            
            const specialtyStats = player.specialty_stats || {};
            const metricMap = {
                "Tiros": [ { label: "Remates Totales p/90", key: "remates_totales_p90" }, { label: "Remates a Puerta p/90", key: "remates_a_puerta_p90" }, { label: "Toques Área Rival p/90", key: "toques_area_rival_p90" } ],
                "Tiros a Puerta": [ { label: "Tiros a Puerta p/90", key: "tiros_a_puerta_p90" }, { label: "% Tiros a Puerta", key: "porcentaje_tiros_a_puerta" }, { label: "Goles por Tiro a Puerta", key: "goles_por_tiro_a_puerta" } ],
                "Tackles": [ { label: "Entradas Exitosas p/90", key: "entradas_exitosas_p90" }, { label: "Intercepciones p/90", key: "intercepciones_p90" }, { label: "Recuperaciones p/90", key: "recuperaciones_balon_p90" } ],
                "Tarjetas": [ { label: "Tarjetas Amarillas", key: "tarjetas_amarillas_totales" }, { label: "Faltas por Tarjeta", key: "faltas_por_tarjeta" }, { label: "Entradas Malogradas p/90", key: "entradas_malogradas_p90" } ],
                "Mayor Rematador": [ { label: "Remates Totales p/90", key: "remates_totales_p90" }, { label: "Remates a Puerta p/90", key: "remates_a_puerta_p90" }, { label: "Toques Área Rival p/90", key: "toques_area_rival_p90" } ],
                "Remates a Puerta": [ { label: "Tiros a Puerta p/90", key: "tiros_a_puerta_p90" }, { label: "% Tiros a Puerta", key: "porcentaje_tiros_a_puerta" }, { label: "Goles por Tiro a Puerta", key: "goles_por_tiro_a_puerta" } ],
                "Más Entradas": [ { label: "Entradas Exitosas p/90", key: "entradas_exitosas_p90" }, { label: "Intercepciones p/90", key: "intercepciones_p90" }, { label: "Recuperaciones p/90", key: "recuperaciones_balon_p90" } ],
                "Faltas Cometidas": [ { label: "Faltas Cometidas p/90", key: "faltas_cometidas_p90" }, { label: "Presiones Exitosas p/90", key: "presiones_exitosas_p90" }, { label: "% Duelos Def. Ganados", key: "porcentaje_duelos_defensivos_ganados" } ],
                "Más Amonestado": [ { label: "Tarjetas Amarillas", key: "tarjetas_amarillas_totales" }, { label: "Faltas por Tarjeta", key: "faltas_por_tarjeta" }, { label: "Entradas Malogradas p/90", key: "entradas_malogradas_p90" } ],
                "Provoca Saques de Meta": [ { label: "Regates Exitosos p/90", key: "regates_exitosos_p90" }, { label: "Pases Clave p/90", key: "pases_clave_p90" }, { label: "Acciones Creación Tiro p/90", key: "acciones_creacion_tiro_p90" } ],
                "Concede Saques de Banda": [ { label: "Despejes p/90", key: "despejes_p90" }, { label: "Bloqueos p/90", key: "bloqueos_p90" }, { label: "Intercepciones p/90", key: "intercepciones_p90" } ]
            };
            const metricsToShow = metricMap[player.specialty] || [];
            const statsHtml = metricsToShow.map(metric => `
                <div class="grid grid-cols-[1fr_auto] gap-x-2 items-baseline">
                    <p class="text-[10px] text-white/80 text-left whitespace-nowrap">${metric.label}</p>
                    <p class="font-bold text-xs text-white text-right">${specialtyStats[metric.key] ?? 'N/A'}</p>
                </div>`).join('');
                
            card.innerHTML = `${playerImageHTML}
                              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent"></div>
                              <div class="relative p-1.5 h-full flex flex-col justify-end">
                                  <div>
                                      <p class="font-bold text-base leading-tight" style="text-shadow: 1px 1px 3px #000;">${player.name}</p>
                                      <p class="text-xs text-gray-300 font-semibold">${player.position || 'Posición no definida'}</p>
                                  </div>
                                  <div class="mt-1 pt-1 border-t border-white/20 space-y-0.5">${statsHtml}</div>
                              </div>`;
        }
        card.dataset.teamType = type;
        card.classList.add('cursor-pointer');
        keyPlayersContainer.appendChild(card);
    });
}

function renderKeyStats(container, stats, hColor, aColor) {
    const keyStatsContainer = container.querySelector('#key-stats-container');
    keyStatsContainer.innerHTML = '';
    (stats || []).forEach(stat => {
        const home = parseFloat(stat.home);
        const away = parseFloat(stat.away);
        const homePerc = (home + away > 0) ? (home / (home + away)) * 100 : 50;
        const blendMargin = 2.5;
        const startBlend = Math.max(0, homePerc - blendMargin);
        const endBlend = Math.min(100, homePerc + blendMargin);
        const statEl = document.createElement('div');
        statEl.innerHTML = `<div class="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-center"><p class="font-bold text-base text-left" style="color: ${hColor}; text-shadow: 0px 0px 5px #000, 0px 0px 5px #000;">${stat.home}</p><h4 class="text-xs font-bold text-gradient">${stat.metric}</h4><p class="font-bold text-base text-right" style="color: ${aColor}; text-shadow: 0px 0px 5px #000, 0px 0px 5px #000;">${stat.away}</p></div><div class="w-full bg-black/30 rounded-full h-1.5 mt-0.5"><div class="h-1.5 rounded-full" style="background: linear-gradient(to right, ${hColor} ${startBlend}%, ${aColor} ${endBlend}%);"></div></div>`;
        keyStatsContainer.appendChild(statEl);
    });
}

function addPlayerMarkerEventListeners() {
    document.querySelectorAll('.player-marker').forEach(el => {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
    });
    document.querySelectorAll('.player-marker').forEach(el => {
        el.addEventListener('mousedown', (e) => startDrag(e, el));
        el.addEventListener('touchstart', (e) => startDrag(e, el, { passive: false }));
        el.addEventListener('dblclick', () => openEditModal(el));
        el.addEventListener('contextmenu', (e) => openSubstitutionBench(e, el));
    });
}

function renderTacticalContext(container, data) {
    const refereeData = _.get(APP_STATE, `database.referees.${data.referee}`, {});
    const heatmapContainer = container.querySelector('#heatmap-container');
    container.querySelector('#scenario-container').innerHTML = `<p>🏟️ ${data.stadium || 'N/A'}</p><p>📍 ${data.location || 'N/A'}</p>`;
    container.querySelector('#home-manager-name').textContent = data.homeTeam.manager || 'N/A';
    container.querySelector('#away-manager-name').textContent = data.awayTeam.manager || 'N/A';
    container.querySelector('#home-formation-display').textContent = data.homeTeam.formation;
    container.querySelector('#away-formation-display').textContent = data.awayTeam.formation;
    container.querySelector('#ref-name').textContent = data.referee || 'N/A';
    container.querySelector('#ref-fouls').textContent = (refereeData.fouls_per_game || 0).toFixed(2);
    container.querySelector('#ref-yellows').textContent = (refereeData.yellows_per_game || 0).toFixed(2);
    container.querySelector('#ref-reds').textContent = (refereeData.reds_per_game || 0).toFixed(2);

    heatmapContainer.innerHTML = `<div class="pitch-shield left" style="background-image: url('${data.homeTeam.logoUrl}')"></div><div class="pitch-shield right" style="background-image: url('${data.awayTeam.logoUrl}')"></div><svg viewBox="0 0 105 68" class="absolute top-0 left-0 w-full h-full opacity-60"><rect x=".25" y=".25" width="104.5" height="67.5" stroke="rgba(255,255,255,0.2)" fill="none"/><path d="M52.5,0 L52.5,68" stroke="rgba(255,255,255,0.2)"/><circle cx="52.5" cy="34" r="9.15" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="0" y="13.84" width="16.5" height="40.32" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="88.5" y="13.84" width="16.5" height="40.32" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="0" y="24.84" width="5.5" height="18.32" stroke="rgba(255,255,255,0.2)" fill="none"/><rect x="99.5" y="24.84" width="5.5" height="18.32" stroke="rgba(255,255,255,0.2)" fill="none"/></svg>`;

    (data.homeTeam.lineup || []).forEach((player, index) => {
        const pos = player.coords;
        const el = document.createElement('div'); el.className = 'player-marker'; el.style.left = `${pos.x}%`; el.style.top = `${pos.y}%`; el.dataset.team = 'home'; el.dataset.id = `home-${index}`;
        el.innerHTML = `<div class="player-number">${player.number}</div><div class="player-name">${player.name.split(' ').pop()}</div>`; heatmapContainer.appendChild(el);
    });
    (data.awayTeam.lineup || []).forEach((player, index) => {
        const pos = player.coords;
        const el = document.createElement('div'); el.className = 'player-marker'; el.style.left = `${pos.x}%`; el.style.top = `${pos.y}%`; el.dataset.team = 'away'; el.dataset.id = `away-${index}`;
        el.innerHTML = `<div class="player-number">${player.number}</div><div class="player-name">${player.name.split(' ').pop()}</div>`; heatmapContainer.appendChild(el);
    });
    updatePlayerStyles(container, 'home', data);
    updatePlayerStyles(container, 'away', data);
    addPlayerMarkerEventListeners();
}

function updatePick(container, odds, stake) {
    container.querySelector('#pick-odds').textContent = odds;
    container.querySelector('#stake-value').textContent = stake;
    const vis = container.querySelector('#stake-visual');
    vis.innerHTML = '';
    const activeBars = Math.round((stake / 25) * 10);
    for (let i = 0; i < 10; i++) {
        const bar = document.createElement('div');
        bar.className = 'w-1.5 rounded-sm';
        bar.style.height = `${(i + 1) * 2 + 4}px`;
        bar.style.backgroundColor = i < activeBars ? 'var(--accent-green)' : 'var(--stake-bar-inactive)';
        vis.appendChild(bar);
    }
}

// --- LÓGICA DE INTERACCIÓN DEL TABLERO ---
function startDrag(e, el) {
    saveState();
    draggedPlayer = el;
    draggedPlayer.classList.add('player-dragging');
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);
    e.preventDefault();
}

function drag(e) {
    if (!draggedPlayer) return;
    e.preventDefault();
    const heatmapContainer = document.getElementById('heatmap-container');
    const pitchRect = heatmapContainer.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    let x = clientX - pitchRect.left;
    let y = clientY - pitchRect.top;
    const team = draggedPlayer.dataset.team;
    const halfWidth = pitchRect.width / 2;

    if (team === 'home') {
        x = Math.max(0, Math.min(x, halfWidth));
    } else {
        x = Math.max(halfWidth, Math.min(x, pitchRect.width));
    }
    y = Math.max(0, Math.min(y, pitchRect.height));

    let newXpercent = (x / pitchRect.width) * 100;
    let newYpercent = (y / pitchRect.height) * 100;

    if (!checkCollisions(newXpercent, newYpercent, team, draggedPlayer.dataset.id)) {
        draggedPlayer.style.left = `${newXpercent}%`;
        draggedPlayer.style.top = `${newYpercent}%`;
    }
}

function endDrag() {
    if (!draggedPlayer) return;

    const teamType = draggedPlayer.dataset.team;
    const playerIndex = parseInt(draggedPlayer.dataset.id.split('-')[1], 10);
    const lineup = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.lineup : APP_STATE.currentMatch.awayTeam.lineup;

    if (lineup[playerIndex]) {
        lineup[playerIndex].coords = {
            x: parseFloat(draggedPlayer.style.left),
            y: parseFloat(draggedPlayer.style.top)
        };
    }

    draggedPlayer.classList.remove('player-dragging');
    draggedPlayer = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', endDrag);
}

function checkCollisions(newX, newY, team, currentPlayerId) {
    const heatmapContainer = document.getElementById('heatmap-container');
    const players = document.querySelectorAll(`.player-marker[data-team="${team}"]`);
    const pitchRect = heatmapContainer.getBoundingClientRect();
    const newXpx = newX / 100 * pitchRect.width;
    const newYpx = newY / 100 * pitchRect.height;
    const collisionThreshold = 25;
    for (const playerEl of players) {
        if (playerEl.dataset.id === currentPlayerId) continue;
        const otherXpx = (parseFloat(playerEl.style.left) / 100) * pitchRect.width;
        const otherYpx = (parseFloat(playerEl.style.top) / 100) * pitchRect.height;
        const distance = Math.sqrt(Math.pow(newXpx - otherXpx, 2) + Math.pow(newYpx - otherYpx, 2));
        if (distance < collisionThreshold) return true;
    }
    return false;
}

function openEditModal(el) {
    editedPlayer = el;
    document.getElementById('edit-player-name').value = el.querySelector('.player-name').textContent;
    document.getElementById('edit-player-number').value = el.querySelector('.player-number').textContent;
    document.getElementById('edit-player-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-player-modal').classList.add('hidden');
    editedPlayer = null;
}

function savePlayerChanges() {
    if (!editedPlayer) return;
    saveState();
    const newName = document.getElementById('edit-player-name').value;
    const newNumber = document.getElementById('edit-player-number').value;
    if(newName) editedPlayer.querySelector('.player-name').textContent = newName;
    if(newNumber) editedPlayer.querySelector('.player-number').textContent = newNumber;
    closeEditModal();
}

function toggleColorEditor(team) {
    const colorEditorPanel = document.getElementById('color-editor-panel');
    const isOpen = colorEditorPanel.classList.contains('is-open');
    if (isOpen && currentEditorTeam === team) {
        colorEditorPanel.classList.remove('is-open');
        currentEditorTeam = null;
    } else {
        currentEditorTeam = team;
        populateColorEditor(team);
        colorEditorPanel.classList.add('is-open');
    }
}

function populateColorEditor(team) {
    const teamName = team === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const teamData = APP_STATE.database.teams[teamName];
    document.getElementById('color-picker-title').textContent = `Diseño Uniforme: ${teamName}`;
    document.getElementById('jersey-color-input').value = teamData.jerseyColor;
    document.getElementById('gk-jersey-color-input').value = teamData.gkJerseyColor;
    document.getElementById('number-color-input').value = teamData.numberColor;
}

function applyJerseyStylesFromPanel() {
    if (!currentEditorTeam) return;
    saveState();
    const teamName = currentEditorTeam === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const teamData = APP_STATE.database.teams[teamName];
    teamData.jerseyColor = document.getElementById('jersey-color-input').value;
    teamData.gkJerseyColor = document.getElementById('gk-jersey-color-input').value;
    teamData.numberColor = document.getElementById('number-color-input').value;
    updatePlayerStyles(document.getElementById('main-app-container'), currentEditorTeam, APP_STATE.currentMatch);
}

function updatePlayerStyles(container, team, data) {
    const teamName = team === 'home' ? data.homeTeam.name : data.awayTeam.name;
    const teamData = APP_STATE.database.teams[teamName] || {};

    if (Object.keys(teamData).length === 0) {
        console.error(`[updatePlayerStyles] No se encontraron datos para el equipo: "${teamName}"`);
        return;
    }

    container.querySelectorAll(`.player-marker[data-team="${team}"]`).forEach((playerEl) => {
        const numberEl = playerEl.querySelector('.player-number');
        if (numberEl) {
            const playerId = playerEl.dataset.id;
            const playerIndex = parseInt(playerId.split('-')[1], 10);
            const lineup = team === 'home' ? data.homeTeam.lineup : data.awayTeam.lineup;

            if (lineup && lineup[playerIndex]) {
                const player = lineup[playerIndex];
                const isGk = player.position_general === 'GK';

                numberEl.style.backgroundColor = isGk ? teamData.gkJerseyColor : teamData.jerseyColor;
                numberEl.style.color = teamData.numberColor;
            }
        }
    });
}

function openFormationMenu(team) {
    const teamData = team === 'home' ? APP_STATE.currentMatch.homeTeam : APP_STATE.currentMatch.awayTeam;
    document.getElementById('formation-modal-title').textContent = `Seleccionar Formación: ${teamData.name}`;
    const container = document.getElementById('formation-buttons-container');
    container.innerHTML = '';
    Object.keys(positionCoords).forEach(key => {
        const button = document.createElement('button');
        button.className = 'menu-button font-bold py-2 px-4 rounded-lg';
        button.textContent = key;
        button.onclick = () => {
            applyGenericFormation(team, key);
            document.getElementById('formation-modal').classList.add('hidden');
        };
        container.appendChild(button);
    });
    document.getElementById('formation-modal').classList.remove('hidden');
}

function applyGenericFormation(team, formationName) {
    saveState();
    const teamData = team === 'home' ? APP_STATE.currentMatch.homeTeam : APP_STATE.currentMatch.awayTeam;
    const newCoords = formationMap[formationName];

    if (!newCoords || newCoords.length < 11) {
        showToast(`Formación "${formationName}" no es válida.`, "error");
        return;
    }

    teamData.lineup.forEach((player, i) => {
        if (team === 'home') {
            player.coords = { x: newCoords[i].x / 2, y: newCoords[i].y };
        } else {
            player.coords = { x: 50 + (100 - newCoords[i].x) / 2, y: 100 - newCoords[i].y };
        }
    });

    teamData.formation = formationName;
    renderAll(APP_STATE.currentMatch);
    showToast(`Formación "${formationName}" aplicada.`, 'success', 2000);
}


function openRefereeMenu() {
    const container = document.getElementById('referee-buttons-container');
    container.innerHTML = '';
    Object.keys(APP_STATE.database.referees).sort().forEach(refName => {
        const button = document.createElement('button');
        button.className = 'menu-button font-bold py-2 px-4 rounded-lg text-left';
        button.textContent = refName;
        button.onclick = () => { selectReferee(refName); };
        container.appendChild(button);
    });
    document.getElementById('referee-modal').classList.remove('hidden');
}

function selectReferee(refName) {
    saveState();
    APP_STATE.currentMatch.referee = refName;
    renderAll(APP_STATE.currentMatch);
    document.getElementById('referee-modal').classList.add('hidden');
}

function openSubstitutionBench(e, el) {
    e.preventDefault();
    playerToSubstitute = el;
    const teamType = el.dataset.team;
    const teamName = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.name : APP_STATE.currentMatch.awayTeam.name;
    const allTeamPlayers = _.get(APP_STATE, ['database', 'players', teamName, 'plantilla'], []);
    const teamData = APP_STATE.database.teams[teamName];
    const currentLineup = teamType === 'home' ? APP_STATE.currentMatch.homeTeam.lineup : APP_STATE.currentMatch.awayTeam.lineup;
    const playersOnPitchNames = new Set(currentLineup.map(p => p.name));
    const substitutes = allTeamPlayers.filter(p => !playersOnPitchNames.has(p.name));

    const categorizedPlayers = { 'Arqueros': [], 'Defensas': [], 'Mediocampistas': [], 'Delanteros': [] };
    const positionMap = { 'GK': 'Arqueros', 'DEF': 'Defensas', 'MID': 'Mediocampistas', 'FWD': 'Delanteros' };
    substitutes.forEach(player => {
        const positionGroup = positionMap[player.position_general];
        if (positionGroup) categorizedPlayers[positionGroup].push(player);
    });

    const benchPlayerList = document.getElementById('bench-player-list');
    benchPlayerList.innerHTML = '';
    const jerseySvg = `<svg viewBox="0 0 60 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 10C25 10 22 7 22 4C22 1 25 0 30 0C35 0 38 1 38 4C38 7 35 10 30 10Z" fill="#AEAEAE"/><path d="M30 11C24 11 20.5 8 20.5 4.5C20.5 1.5 24 0.5 30 0.5C36 0.5 39.5 1.5 39.5 4.5C39.5 8 36 11 30 11Z" stroke="#E0E0E0" stroke-width="2.5" transform="translate(0, -1)"/><path d="M20.5 5.5C18 7 15 7.5 12.5 8L0 12L3 21L9 54.5H51L57 21L60 12L47.5 8C45 7.5 42 7 39.5 5.5L38 4C35 1 30 1 30 1S25 1 22 4L20.5 5.5Z" class="jersey-color-path"/><path d="M20.5 5.5C18 7 15 7.5 12.5 8L0 12V24L10 54.5H30V5.5C27 5.5 23 5.5 20.5 5.5Z" fill="black" fill-opacity="0.1"/></svg>`;

    for (const position in categorizedPlayers) {
        const group = categorizedPlayers[position];
        if (group.length > 0) {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'bench-player-group';
            const groupHeader = document.createElement('h4');
            groupHeader.className = 'bench-player-group-header';
            groupHeader.textContent = position;
            groupContainer.appendChild(groupHeader);
            const grid = document.createElement('div');
            grid.className = 'bench-player-grid';
            group.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'bench-player-card';
                const isGk = player.position_general === 'GK';
                const jerseyColor = isGk ? teamData.gkJerseyColor : teamData.jerseyColor;
                const numberColor = teamData.numberColor;
                playerCard.innerHTML = `<div class="jersey-icon">${jerseySvg}<span class="jersey-number-on-card" style="color: ${numberColor};">${player.number}</span></div><span class="bench-player-name">${player.name}</span>`;
                playerCard.querySelector('.jersey-color-path').style.fill = jerseyColor;
                playerCard.onclick = () => { swapPlayers(player); };
                grid.appendChild(playerCard);
            });
            groupContainer.appendChild(grid);
            benchPlayerList.appendChild(groupContainer);
        }
    }
    document.getElementById('bench-panel').classList.add('is-open');
}

function swapPlayers(newPlayer) {
    if (!playerToSubstitute) return;
    saveState();
    const team = playerToSubstitute.dataset.team;
    const lineup = team === 'home' ? APP_STATE.currentMatch.homeTeam.lineup : APP_STATE.currentMatch.awayTeam.lineup;
    const idParts = playerToSubstitute.dataset.id.split('-');
    const oldPlayerIndex = parseInt(idParts[1], 10);
    if (oldPlayerIndex >= 0 && oldPlayerIndex < lineup.length) {
        const oldPlayer = lineup[oldPlayerIndex];
        // Conservar las coordenadas y la clave de posición del jugador que sale
        newPlayer.coords = oldPlayer.coords;
        newPlayer.position_key = oldPlayer.position_key;
        lineup[oldPlayerIndex] = newPlayer;
        renderAll(APP_STATE.currentMatch);
        document.getElementById('bench-panel').classList.remove('is-open');
    }
    playerToSubstitute = null;
}

function openKeyPlayerSelector(teamType) {
    const teamName = teamType === 'home' ? APP_STATE.currentMatch.home : APP_STATE.currentMatch.away;
    const faces = APP_STATE.database.faces[teamName];
    if (!faces) { showToast(`No se encontraron protagonistas para ${teamName}`, "error"); return; }

    const modal = document.getElementById('key-player-selector-modal');
    const title = document.getElementById('key-player-modal-title');
    const grid = document.getElementById('key-player-selection-grid');

    title.textContent = `Seleccionar Protagonista para ${teamName}`;
    grid.innerHTML = '';

    for (const specialtyKey in faces) {
        const player = faces[specialtyKey];
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.innerHTML = `<img src="${player.photoUrl}" alt="${player.name}"><p class="player-name">${player.name}</p><p class="player-specialty">${specialtyKey}</p>`;
        item.onclick = () => {
            saveState();
            const selectedPlayer = { ...player, specialty: specialtyKey };
            APP_STATE.currentMatch.keyPlayers[teamType] = selectedPlayer;
            renderAll(APP_STATE.currentMatch);
            modal.classList.add('hidden');
        };
        grid.appendChild(item);
    }
    modal.classList.remove('hidden');
}

function findTeamStats(teamName) {
    const tournamentStats = _.get(APP_STATE, ['database', 'tournamentData', 'team_stats'], {});
    const statsKeys = Object.keys(tournamentStats);
    const cleanTeamName = (teamName || '').toLowerCase().replace('afc', '').trim();
    const foundKey = statsKeys.find(key => {
        const cleanKey = key.toLowerCase().replace('afc', '').trim();
        return cleanKey.includes(cleanTeamName) || cleanTeamName.includes(cleanKey);
    });
    return foundKey ? tournamentStats[foundKey] : {};
}

// --- CARGA DE ARCHIVOS E INICIALIZACIÓN DE LA APLICACIÓN ---
function prepareAndShowWorkbench(homeTeamName, awayTeamName) {
    APP_STATE.history = [];
    APP_STATE.analysisGenerated = false;

    const homeTeamDB = _.get(APP_STATE, ['database', 'players', homeTeamName], null);
    const awayTeamDB = _.get(APP_STATE, ['database', 'players', awayTeamName], null);

    if (!homeTeamDB) {
        showToast(`Error: No se encontraron datos para el equipo "${homeTeamName}" en players.json.`, "error");
        return;
    }
    if (!awayTeamDB) {
        showToast(`Error: No se encontraron datos para el equipo "${awayTeamName}" en players.json.`, "error");
        return;
    }

    const homeDefaultPresetName = homeTeamDB.tactics?.default || Object.keys(homeTeamDB.tactics?.presets || {})[0];
    const awayDefaultPresetName = awayTeamDB.tactics?.default || Object.keys(awayTeamDB.tactics?.presets || {})[0];

    if (!homeDefaultPresetName) {
        showToast(`No se encontró preset por defecto para ${homeTeamName}. Se usará una alineación genérica.`, "error");
    }
    if (!awayDefaultPresetName) {
        showToast(`No se encontró preset por defecto para ${awayTeamName}. Se usará una alineación genérica.`, "error");
    }

    let homeLineup = generateStartingLineup(homeTeamName, homeDefaultPresetName);
    let awayLineup = generateStartingLineup(awayTeamName, awayDefaultPresetName);

    homeLineup.forEach(player => {
        player.coords = { x: player.coords.x / 2, y: player.coords.y };
    });
    awayLineup.forEach(player => {
        player.coords = { x: 50 + (100 - player.coords.x) / 2, y: 100 - player.coords.y };
    });

    const homeTeamData = APP_STATE.database.teams[homeTeamName];
    const awayTeamData = APP_STATE.database.teams[awayTeamName];
    const homeTournamentStats = findTeamStats(homeTeamName);
    const awayTournamentStats = findTeamStats(awayTeamName);
    const homeYellows = _.get(homeTournamentStats, 'home_stats.yellow_cards_per_game', 0);
    const homeReds = _.get(homeTournamentStats, 'home_stats.red_cards_per_game', 0);
    const awayYellows = _.get(awayTournamentStats, 'away_stats.yellow_cards_per_game', 0);
    const awayReds = _.get(awayTournamentStats, 'away_stats.red_cards_per_game', 0);

    const homeFormation = _.get(homeTeamDB, ['tactics', 'presets', homeDefaultPresetName, 'formation'], '4-3-3');
    const awayFormation = _.get(awayTeamDB, ['tactics', 'presets', awayDefaultPresetName, 'formation'], '4-3-3');

    APP_STATE.currentMatch = {
        home: homeTeamName,
        away: awayTeamName,
        pick: { market: "Pick no definido" },
        odds: "1.00",
        fundamentals: [],
        keyStats: [
            { metric: 'Remates', home: Number((_.get(homeTournamentStats, 'home_stats.shots_per_game', 0)).toFixed(1)), away: Number((_.get(awayTournamentStats, 'away_stats.shots_per_game', 0)).toFixed(1)) },
            { metric: 'Remates a Puerta', home: Number((_.get(homeTournamentStats, 'home_stats.shots_on_target_per_game', 0)).toFixed(1)), away: Number((_.get(awayTournamentStats, 'away_stats.shots_on_target_per_game', 0)).toFixed(1)) },
            { metric: 'Faltas Cometidas', home: Number((_.get(homeTournamentStats, 'home_stats.fouls_per_game', 0)).toFixed(1)), away: Number((_.get(awayTournamentStats, 'away_stats.fouls_per_game', 0)).toFixed(1)) },
            { metric: 'Saques de Esquina', home: Number((_.get(homeTournamentStats, 'home_stats.corners_per_game', 0)).toFixed(1)), away: Number((_.get(awayTournamentStats, 'away_stats.corners_per_game', 0)).toFixed(1)) },
            { metric: 'Total de Tarjetas', home: Number((homeYellows + (homeReds * 2)).toFixed(1)), away: Number((awayYellows + (awayReds * 2)).toFixed(1)) },
        ],
        keyPlayers: { home: Object.values(APP_STATE.database.faces[homeTeamName] || {})[0], away: Object.values(APP_STATE.database.faces[awayTeamName] || {})[0] },
        referee: Object.keys(APP_STATE.database.referees)[0],
        verdict_score: 50,
        stadium: homeTeamData.stadium || "Estadio no definido",
        location: homeTeamData.location || "Ubicación no definida",
        homeTeam: { name: homeTeamName, ...homeTeamData, formation: homeFormation, lineup: homeLineup },
        awayTeam: { name: awayTeamName, ...awayTeamData, formation: awayFormation, lineup: awayLineup }
    };

    const mainContainer = document.getElementById('main-app-container');
    const template = document.getElementById('main-content-template');
    mainContainer.innerHTML = '';
    mainContainer.appendChild(template.content.cloneNode(true));

    renderAll(APP_STATE.currentMatch);

    document.getElementById('team-selection-modal').classList.add('hidden');
    mainContainer.classList.remove('hidden');
    mainContainer.classList.add('flex');

    APP_STATE.activePage = 'analysis';
    saveFullAppState();
}


function renderAll(data) {
    if (!data) return;
    const mainContainer = document.getElementById('main-app-container');
    renderStaticData(mainContainer, data); // Llama a la función actualizada
    renderFundamentals(mainContainer, data.fundamentals);
    let homeColor = data.homeTeam.shieldColor || '#FFFFFF';
    let awayColor = data.awayTeam.shieldColor || '#FFFFFF';

    if (areColorsSimilar(homeColor, awayColor)) {
        awayColor = '#FFFFFF';
        if (areColorsSimilar(homeColor, '#FFFFFF')) {
            awayColor = data.awayTeam.secondaryColor || '#CCCCCC';
        }
    }
    renderKeyStats(mainContainer, data.keyStats, homeColor, awayColor);
    renderKeyPlayers(mainContainer, data);
    renderTacticalContext(mainContainer, data);
    const score = data.verdict_score, stake = score >= 95 ? 25 : score >= 85 ? 20 : score >= 75 ? 15 : score >= 65 ? 10 : 5;
    updatePick(mainContainer, data.odds, stake);
    mainContainer.querySelector('#key-players-container').addEventListener('click', (e) => { const card = e.target.closest('.card, .group, .key-player-card'); if(card && card.dataset.teamType) openKeyPlayerSelector(card.dataset.teamType); });
}

function updateClassicSelection() {
    const classicsGrid = document.getElementById('classics-buttons-grid');
    if (!classicsGrid) return;
    const buttons = classicsGrid.querySelectorAll('.classic-button');
    buttons.forEach(btn => btn.classList.remove('selected'));

    if (!APP_STATE.selectedHome || !APP_STATE.selectedAway) return;

    const selectedHome = APP_STATE.selectedHome;
    const selectedAway = APP_STATE.selectedAway;

    for (const button of buttons) {
        const home = button.dataset.home;
        const away = button.dataset.away;

        if ((home === selectedHome && away === selectedAway) || (home === selectedAway && away === selectedHome)) {
            button.classList.add('selected');
        }
    }
}

function handleTeamSelection(teamName, type) {
    APP_STATE[type] = teamName;

    document.querySelectorAll(`#${type === 'selectedHome' ? 'home' : 'away'}-team-list .team-selection-item`).forEach(el => {
        el.classList.toggle('selected', el.dataset.teamName === teamName);
    });

    const openWorkbenchBtn = document.getElementById('open-workbench-btn');
    if (APP_STATE.selectedHome && APP_STATE.selectedAway) {
        openWorkbenchBtn.disabled = false;
        const classics = _.get(APP_STATE, 'database.classics', null);
        let classicFound = false;
        if (classics) {
            for (const classicName in classics) {
                const classicData = classics[classicName];
                const teams = classicData.teams;
                if (teams.includes(APP_STATE.selectedHome) && teams.includes(APP_STATE.selectedAway)) {
                    const classicButton = document.querySelector(`.classic-button[data-classic-name="${classicName}"]`);
                    if (classicButton && classicButton.dataset.customTheme) {
                        applyTheme(classicButton.dataset.customTheme);
                        classicFound = true;
                    }
                    break;
                }
            }
        }
        if (!classicFound) {
            const league = leagues.find(l => l.type === APP_STATE.currentLeagueType);
            if (league && leagueThemes[league.type]) {
                const defaultTheme = leagueThemes[league.type][0].id;
                applyTheme(defaultTheme);
            }
        }
    } else {
        openWorkbenchBtn.disabled = true;
    }
    updateClassicSelection();
}


function showTeamSelector() {
    const homeList = document.getElementById('home-team-list');
    const awayList = document.getElementById('away-team-list');
    const classicsContainer = document.getElementById('classics-container');
    const classicsGrid = document.getElementById('classics-buttons-grid');

    homeList.innerHTML = '';
    awayList.innerHTML = '';
    classicsGrid.innerHTML = '';
    APP_STATE.selectedHome = null;
    APP_STATE.selectedAway = null;
    document.getElementById('open-workbench-btn').disabled = true;

    const teamNames = Object.keys(APP_STATE.database.teams).sort();
    teamNames.forEach(teamName => {
        const team = APP_STATE.database.teams[teamName];
        const item = document.createElement('div');
        item.className = 'team-selection-item';
        item.dataset.teamName = teamName;
        item.innerHTML = `<img src="${team.logoUrl}" alt="${teamName}" loading="lazy" width="24" height="24"><span>${teamName}</span>`;

        const homeItem = item.cloneNode(true);
        const awayItem = item.cloneNode(true);

        homeItem.addEventListener('click', () => handleTeamSelection(teamName, 'selectedHome'));
        awayItem.addEventListener('click', () => handleTeamSelection(teamName, 'selectedAway'));

        homeList.appendChild(homeItem);
        awayList.appendChild(awayItem);
    });
    
    const classics = _.get(APP_STATE, 'database.classics', null);
    if (classics && Object.keys(classics).length > 0) {
        classicsContainer.classList.remove('hidden');
        
        const classicThemeMaps = {
            premier: { "North-West Derby": "north-west-derby", "The Modern Classic": "modern-classic", "North London Derby": "north-london-derby", "Merseyside Derby": "merseyside-derby", "Manchester Derby": "manchester-derby", "Tyne-Wear Derby": "tyne-wear-derby", "Roses Rivalry": "roses-rivalry", "M23 Derby": "m23-derby", "West London Derby": "west-london-derby", "London Derby": "london-derby", "West Midlands Derby": "west-midlands-derby" },
            laliga: { "El Clásico": "el-clasico-liga", "El Derbi Madrileño": "derbi-madrileno", "El Gran Derbi": "gran-derbi", "El Derbi Vasco": "derbi-vasco", "Derbi de la Comunitat": "derbi-comunitat", "Derbi del Turia": "derbi-turia", "El Derbi Barceloní": "derbi-barceloni" },
            bundesliga: { "Der Klassiker": "der-klassiker-theme", "Rheinderby": "rheinderby-theme", "Revierderby": "revierderby-theme", "Nordderby": "nordderby-theme", "Suedderby": "suedderby-theme" },
            ligue1: { "Le Classique": "le-classique-theme", "Choc des Olympiques": "choc-olympiques-theme", "Derby du Nord": "derby-du-nord-theme", "Derby de la Côte d'Azur": "derby-cote-azur-theme", "Derby Breton": "derby-breton-theme" },
            seriea: { "Derby d'Italia": "derby-ditalia-theme", "Derby della Madonnina": "derby-madonnina-theme", "Derby della Capitale": "derby-capitale-theme", "Derby della Mole": "derby-della-mole-theme", "Derby del Sole": "derby-del-sole-theme" }
        };

        const activeThemeMap = classicThemeMaps[APP_STATE.currentLeagueType] || {};

        for (const classicName in classics) {
            const classicData = classics[classicName];
            const [team1Name, team2Name] = classicData.teams;
            const team1 = APP_STATE.database.teams[team1Name];
            const team2 = APP_STATE.database.teams[team2Name];

            if (!team1 || !team2) {
                console.warn(`Equipos para el clásico "${classicName}" no encontrados.`);
                continue;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'classic-button rounded-lg text-sm font-semibold';
            button.dataset.home = team1Name;
            button.dataset.away = team2Name;
            button.dataset.classicName = classicName;
            button.dataset.customTheme = activeThemeMap[classicName] || '';

            button.innerHTML = `<img src="${team1.logoUrl}" alt="${team1.name}"><span class="text-xs">${classicName}</span><img src="${team2.logoUrl}" alt="${team2.name}">`;

            button.addEventListener('click', () => {
                handleTeamSelection(team1Name, 'selectedHome');
                handleTeamSelection(team2Name, 'selectedAway');
            });
            classicsGrid.appendChild(button);
        }
    } else {
        classicsContainer.classList.add('hidden');
    }

    document.getElementById('file-importer-modal').classList.add('hidden');
    document.getElementById('team-selection-modal').classList.remove('hidden');
    APP_STATE.activePage = 'team-selection';
    saveFullAppState();
}


function showImporter(resetForm = true) {
    const league = leagues.find(l => l.type === APP_STATE.currentLeagueType);
    if (league && leagueThemes[league.type]) {
        const defaultTheme = leagueThemes[league.type][0].id;
        applyTheme(defaultTheme);
    }
    
    if (resetForm) {
        document.getElementById('file-upload-form').reset();
        document.querySelectorAll('.file-upload-label .upload-text').forEach(span => {
            span.textContent = span.dataset.defaultText;
            span.classList.remove('filename');
        });
        document.querySelectorAll('.file-upload-card').forEach(card => card.classList.remove('file-loaded'));
        document.querySelectorAll('.upload-checkmark').forEach(check => check.classList.add('hidden'));
    }

    document.getElementById('team-selection-modal').classList.add('hidden');
    document.getElementById('main-app-container').classList.add('hidden');
    document.getElementById('main-app-container').classList.remove('flex');
    document.getElementById('file-importer-modal').classList.remove('hidden');
    APP_STATE.activePage = 'selector';
    saveFullAppState();
}

function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                resolve(JSON.parse(event.target.result));
            } catch (e) {
                reject(new Error(`Error al analizar ${file.name}: ${e.message}. Asegúrate de que sea un JSON válido sin comentarios.`));
            }
        };
        reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
        reader.readAsText(file);
    });
}

// --- LÓGICA DE DESHACER CAMBIOS (CTRL+Z) ---
function saveState() {
    if (!APP_STATE.currentMatch) return;
    const stateCopy = _.cloneDeep(APP_STATE.currentMatch);
    APP_STATE.history.push(stateCopy);
    if (APP_STATE.history.length > APP_STATE.historyLimit) {
        APP_STATE.history.shift();
    }
    saveFullAppState();
}

function undoLastChange() {
    if (APP_STATE.history.length > 0) {
        const previousState = APP_STATE.history.pop();
        APP_STATE.currentMatch = previousState;
        renderAll(APP_STATE.currentMatch);
        saveFullAppState();
        showToast("Último cambio deshecho.", "info", 2000);
    } else {
        showToast("No hay más acciones que deshacer.", "info");
    }
}

// --- ============================================ ---
// --- INICIO DE LA NUEVA LÓGICA DE BAJAS MANUALES ---
// --- ============================================ ---

let currentManualAbsencesTeamType = 'home'; // Para saber qué equipo estamos editando

function closeManualAbsencesModal() {
    document.getElementById('manual-absences-modal').classList.add('hidden');
}

function openManualAbsencesModal(teamType) {
    currentManualAbsencesTeamType = teamType;
    const teamName = (teamType === 'home') ? APP_STATE.currentMatch.home : APP_STATE.currentMatch.away;
    const roster = _.get(APP_STATE, ['database', 'players', teamName, 'plantilla'], []);

    if (roster.length === 0) {
        showToast(`No se encontró la plantilla para ${teamName}`, "error");
        return;
    }

    const modal = document.getElementById('manual-absences-modal');
    const title = document.getElementById('manual-absences-title');
    const grid = document.getElementById('manual-absences-grid');
    
    const currentAbsencesText = document.getElementById(`generator-absences-textarea-${teamType}`).value;
    const currentSelectedNames = new Set(currentAbsencesText.split(', ').filter(Boolean));

    title.textContent = `Seleccionar Bajas: ${teamName}`;
    grid.innerHTML = ''; 

    roster.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-selection-card'; 
        playerCard.textContent = player.name;
        playerCard.dataset.name = player.name;
        
        if (currentSelectedNames.has(player.name)) {
            playerCard.classList.add('selected');
        }

        playerCard.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('selected');
        });

        grid.appendChild(playerCard);
    });

    modal.classList.remove('hidden');
}

function confirmManualAbsences() {
    const grid = document.getElementById('manual-absences-grid');
    const selectedCards = grid.querySelectorAll('.player-selection-card.selected');
    
    const selectedNames = Array.from(selectedCards).map(card => card.dataset.name);
    
    const textarea = document.getElementById(`generator-absences-textarea-${currentManualAbsencesTeamType}`);
    textarea.value = selectedNames.join(', ');

    closeManualAbsencesModal();
}

// --- ============================================ ---
// --- FIN DE LA NUEVA LÓGICA DE BAJAS MANUALES ---
// --- ============================================ ---


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadFullAppState();
    initializeSelectorPage();

    const form = document.getElementById('file-upload-form');
    if(form) {
        form.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', () => {
                const card = document.getElementById(`card-${input.id}`);
                const textSpan = card.querySelector('.upload-text');
                const checkmark = card.querySelector('.upload-checkmark');
                if (input.files.length > 0) {
                    card.classList.add('file-loaded');
                    textSpan.textContent = input.files[0].name;
                    textSpan.classList.add('filename');
                    checkmark.classList.remove('hidden');
                } else {
                    card.classList.remove('file-loaded');
                    textSpan.textContent = textSpan.dataset.defaultText;
                    textSpan.classList.remove('filename');
                    checkmark.classList.add('hidden');
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileIds = ['league-file', 'players-file', 'referees-file', 'faces-file', 'tournament-data-file', 'classics-file'];
            const filePromises = fileIds.map(id => readFileAsJson(document.getElementById(id).files[0]));
            try {
                const [leagueData, players, referees, faces, tournamentData, classics] = await Promise.all(filePromises);
                if (!leagueData || !players || !referees || !faces || !tournamentData) {
                    showToast("Por favor, selecciona los cinco archivos requeridos.", "error");
                    return;
                }
                APP_STATE.database = { teams: leagueData.teams, theme: leagueData.theme, players, referees, faces: faces.player_stats || faces, tournamentData, classics };
                showTeamSelector();
            } catch (error) {
                showToast(`Error al cargar los archivos: ${error.message}`, "error");
                console.error(error);
            }
        });
    }

    const backToImporterBtn = document.getElementById('back-to-importer-btn');
    if(backToImporterBtn) backToImporterBtn.addEventListener('click', () => showImporter(false));

    const openWorkbenchBtn = document.getElementById('open-workbench-btn');
    if(openWorkbenchBtn) openWorkbenchBtn.onclick = () => { if (APP_STATE.selectedHome && APP_STATE.selectedAway) { if (APP_STATE.selectedHome === APP_STATE.selectedAway) { showToast("Por favor, selecciona dos equipos diferentes.", "error"); return; } prepareAndShowWorkbench(APP_STATE.selectedHome, APP_STATE.selectedAway); } };

    const closeGeneratorModalBtn = document.getElementById('close-generator-modal');
    if(closeGeneratorModalBtn) closeGeneratorModalBtn.addEventListener('click', () => { closeAIGeneratorModal(); });

    const resetSessionBtn = document.getElementById('reset-session-btn');
    if(resetSessionBtn) resetSessionBtn.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que quieres reiniciar la sesión? Se perderá toda la información cargada y el análisis actual.")) {
            localStorage.removeItem('khipuProState');
            location.reload();
        }
    });
    const captureModeBtn = document.getElementById('capture-mode-btn');
     if(captureModeBtn) {
        captureModeBtn.addEventListener('click', () => {
            const mainContainer = document.getElementById('main-app-container');
            const analysisPage = document.getElementById('page-analysis');
            mainContainer.classList.toggle('capture-mode');
            analysisPage.classList.toggle('capture-mode-active');
            captureModeBtn.classList.toggle('active');
        });
    }

    const exportImageBtn = document.getElementById('export-image-btn');
    if (exportImageBtn) {
        exportImageBtn.addEventListener('click', () => {
            const analysisContainer = document.getElementById('main-app-container');
            const settingsContainer = document.getElementById('analysis-settings-container');
            if (!analysisContainer || !APP_STATE.currentMatch) {
                showToast("No hay análisis para exportar.", "error");
                return;
            }

            showToast("Preparando exportación, por favor espera...", "info");

            const originalMode = analysisContainer.classList.contains('capture-mode');
            if (!originalMode) {
                analysisContainer.classList.add('capture-mode');
                settingsContainer.classList.add('controls-hidden');
            }

            setTimeout(() => {
                html2canvas(analysisContainer, {
                    backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-premier'),
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `Khipu-Pro_${APP_STATE.currentMatch.home}_vs_${APP_STATE.currentMatch.away}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showToast("¡Imagen exportada con éxito!", "success");

                    if (!originalMode) {
                        analysisContainer.classList.remove('capture-mode');
                        settingsContainer.classList.remove('controls-hidden');
                    }
                }).catch(err => {
                    console.error("Error al exportar imagen:", err);
                    showToast("Hubo un error al exportar la imagen.", "error");
                    if (!originalMode) {
                        analysisContainer.classList.remove('capture-mode');
                        settingsContainer.classList.remove('controls-hidden');
                    }
                });
            }, 500);
        });
    }

    const generateBtn = document.getElementById('generate-analysis-btn-unified');
    if(generateBtn) generateBtn.addEventListener('click', generateAndApplyAIPick);

    const selectHomeBtn = document.getElementById('select-absences-btn-home');
    if (selectHomeBtn) {
        selectHomeBtn.addEventListener('click', () => openManualAbsencesModal('home'));
    }

    const selectAwayBtn = document.getElementById('select-absences-btn-away');
    if (selectAwayBtn) {
        selectAwayBtn.addEventListener('click', () => openManualAbsencesModal('away'));
    }

    const retryBtn = document.getElementById('generator-retry-btn');
    if(retryBtn) retryBtn.addEventListener('click', () => {
        document.getElementById('generator-error-container').classList.add('hidden');
        generateAndApplyAIPick();
    });

    const modalsContainer = document.getElementById('modals-container');
    if(modalsContainer) {
        modalsContainer.innerHTML = `
            <div id="referee-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-2xl"><h3 class="font-bold text-lg text-gradient mb-4 text-center">Seleccionar Árbitro</h3><div id="referee-buttons-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar"></div><button onclick="document.getElementById('referee-modal').classList.add('hidden')" class="modal-button w-1/2 mx-auto mt-4">Cerrar</button></div></div>
            <div id="formation-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-md text-center"><h3 id="formation-modal-title" class="font-bold text-lg text-gradient mb-4">Seleccionar Formación</h3><div id="formation-buttons-container" class="grid grid-cols-3 gap-2"></div><button onclick="document.getElementById('formation-modal').classList.add('hidden')" class="modal-button w-1/2 mx-auto">Cerrar</button></div></div>
            <div id="edit-pick-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-xs text-center"><h3 class="font-bold text-lg text-gradient mb-2">Editar Pick</h3><input id="edit-odds-input" type="number" step="0.01" class="modal-input"><input id="edit-stake-input" type="number" step="1" class="modal-input"><div class="flex gap-2"><button id="save-pick-changes" class="modal-button w-full">Guardar</button><button onclick="document.getElementById('edit-pick-modal').classList.add('hidden')" class="modal-button modal-button-secondary w-full">Cancelar</button></div></div></div>
            <div id="edit-title-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-sm text-center"><h3 class="font-bold text-lg text-gradient mb-2">Editar Título del Pick</h3><input id="edit-title-input" type="text" class="modal-input"><div class="flex gap-2"><button id="save-title-changes" class="modal-button w-full">Guardar</button><button onclick="document.getElementById('edit-title-modal').classList.add('hidden')" class="modal-button modal-button-secondary w-full">Cancelar</button></div></div></div>
            <div id="edit-player-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="card p-6 rounded-lg w-full max-w-xs text-center"><h3 class="font-bold text-lg text-gradient mb-2">Editar Jugador</h3><input id="edit-player-name" type="text" class="modal-input"><input id="edit-player-number" type="number" class="modal-input"><div class="flex gap-2"><button id="save-player-changes" class="modal-button w-full">Guardar</button><button onclick="closeEditModal()" class="modal-button modal-button-secondary w-full">Cancelar</button></div></div></div>
            <div id="color-editor-panel" class="editor-panel fixed top-0 left-0 h-full w-full max-w-xs border-r-2 shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col p-6" style="border-color: var(--border-color); background-color: var(--bg-premier);"><div class="flex justify-between items-center mb-4"><h3 id="color-picker-title" class="font-bold text-lg text-gradient">Estudio de Diseño</h3><button onclick="document.getElementById('color-editor-panel').classList.remove('is-open')" class="hover:text-accent-green transition-colors" style="color: var(--text-primary);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><div class="space-y-4 text-left overflow-y-auto no-scrollbar flex-grow"><div><label class="stat-label" for="jersey-color-input">Color de Vestimenta</label><input type="color" id="jersey-color-input" class="color-picker-input"></div><div><label class="stat-label" for="gk-jersey-color-input">Vestimenta del Arquero</label><input type="color" id="gk-jersey-color-input" class="color-picker-input"></div><div><label class="stat-label" for="number-color-input">Color del Dorsal</label><input type="color" id="number-color-input" class="color-picker-input"></div></div></div>
            <div id="bench-panel" class="bench-panel"><div id="bench-content" class="bench-content"><button onclick="document.getElementById('bench-panel').classList.remove('is-open')" class="bench-close-button">&times;</button><h3 class="bench-header text-gradient">Banco de Suplentes</h3><div id="bench-player-list" class="bench-player-list"></div></div></div>
            <div id="key-player-selector-modal" class="selection-modal hidden"><div class="selection-content"><h2 id="key-player-modal-title" class="text-2xl font-bold text-gradient mb-4 text-center"></h2><div id="key-player-selection-grid" class="selection-grid no-scrollbar"></div><button onclick="document.getElementById('key-player-selector-modal').classList.add('hidden')" class="modal-button w-1/2 mx-auto mt-4">Cerrar</button></div></div>
            
            <div id="manual-absences-modal" class="selection-modal hidden">
                <div class="selection-content max-w-2xl">
                    <button id="close-manual-absences-btn" class="bench-close-button absolute top-4 right-4">&times;</button>
                    <h2 id="manual-absences-title" class="text-2xl font-bold text-gradient mb-4 text-center">Seleccionar Bajas</h2>
                    <div id="manual-absences-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto p-2 rounded-lg bg-[var(--bg-inner-panel)] border border-[var(--border-color)]"></div>
                    <button id="confirm-manual-absences-btn" class="modal-button w-full mt-4">Confirmar Selección</button>
                </div>
            </div>
        `;

        document.getElementById('analysis-settings-toggle-btn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('analysis-theme-panel').classList.toggle('hidden'); });
        document.addEventListener('contextmenu', (e) => {
    // Permitir clic derecho en jugadores, campos de texto, inputs y selects
    if (e.target.closest('.player-marker') || e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') {
        return; // No hacer nada, dejar que aparezca el menú
    }
    e.preventDefault(); // Bloquear el menú en el resto de la app
});
        document.getElementById('save-player-changes').addEventListener('click', savePlayerChanges);
        document.getElementById('save-title-changes').addEventListener('click', () => {
            const newTitle = document.getElementById('edit-title-input').value;
            if (APP_STATE.currentMatch && newTitle) {
                APP_STATE.currentMatch.pick.market = newTitle;
                document.getElementById('pick-title').textContent = newTitle.toUpperCase();
                saveFullAppState();
            }
            document.getElementById('edit-title-modal').classList.add('hidden');
        });

        document.body.addEventListener('dblclick', (e) => {
            if (e.target.closest('#pick-editor-container')) {
                if (!APP_STATE.currentMatch) return;
                saveState();
                document.getElementById('edit-odds-input').value = APP_STATE.currentMatch.odds;
                document.getElementById('edit-stake-input').value = APP_STATE.currentMatch.verdict_score >= 95 ? 25 : APP_STATE.currentMatch.verdict_score >= 85 ? 20 : APP_STATE.currentMatch.verdict_score >= 75 ? 15 : APP_STATE.currentMatch.verdict_score >= 65 ? 10 : 5;
                document.getElementById('edit-pick-modal').classList.remove('hidden');
            }
            if (e.target.closest('#pick-title')) {
                 if (!APP_STATE.currentMatch) return;
                saveState();
                document.getElementById('edit-title-input').value = APP_STATE.currentMatch.pick.market;
                document.getElementById('edit-title-modal').classList.remove('hidden');
            }
        });
        document.getElementById('save-pick-changes').addEventListener('click', () => {
            const newOdds = document.getElementById('edit-odds-input').value;
            const newStake = document.getElementById('edit-stake-input').value;
            if (APP_STATE.currentMatch) {
                APP_STATE.currentMatch.odds = newOdds || APP_STATE.currentMatch.odds;
                updatePick(document.getElementById('main-app-container'), APP_STATE.currentMatch.odds, newStake);
                saveFullAppState();
            }
            document.getElementById('edit-pick-modal').classList.add('hidden');
        });
        ['jersey-color-input', 'gk-jersey-color-input', 'number-color-input'].forEach(id => {
            document.getElementById(id).addEventListener('input', applyJerseyStylesFromPanel);
        });

        const confirmManualBtn = document.getElementById('confirm-manual-absences-btn');
        if (confirmManualBtn) {
            confirmManualBtn.addEventListener('click', confirmManualAbsences);
        }
        
        const closeManualBtn = document.getElementById('close-manual-absences-btn');
        if (closeManualBtn) {
            closeManualBtn.addEventListener('click', closeManualAbsencesModal);
        }
    }

    const shortcutsMenu = document.getElementById('shortcuts-menu');
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey) {
            e.preventDefault();
            const settingsContainer = document.getElementById('analysis-settings-container');
            const analysisPage = document.getElementById('page-analysis');
            if (analysisPage.classList.contains('capture-mode-active') && settingsContainer) {
                settingsContainer.classList.toggle('controls-hidden');
            }
        }
        if (e.ctrlKey && e.shiftKey) shortcutsMenu.classList.add('is-visible');

        if (e.key === 'Escape') {
            e.preventDefault();
            const closableElementIds = [ 'referee-modal', 'formation-modal', 'edit-pick-modal', 'edit-title-modal', 'edit-player-modal', 'key-player-selector-modal', 'ai-generator-modal', 'manual-absences-modal' ];
            let overlayWasClosed = false;
            for (const id of closableElementIds) {
                const el = document.getElementById(id);
                if (el && !el.classList.contains('hidden')) {
                    if (id === 'ai-generator-modal') {
                        closeAIGeneratorModal();
                    } else {
                        el.classList.add('hidden');
                    }
                    overlayWasClosed = true;
                    break;
                }
            }
            const colorEditor = document.getElementById('color-editor-panel');
            if (!overlayWasClosed && colorEditor.classList.contains('is-open')) {
                colorEditor.classList.remove('is-open');
                overlayWasClosed = true;
            }
            const benchPanel = document.getElementById('bench-panel');
            if (!overlayWasClosed && benchPanel.classList.contains('is-open')) {
                benchPanel.classList.remove('is-open');
                overlayWasClosed = true;
            }

            if (!overlayWasClosed) {
                switch (APP_STATE.activePage) {
                    case 'analysis':
                        document.getElementById('main-app-container').classList.add('hidden');
                        document.getElementById('main-app-container').classList.remove('flex');
                        showTeamSelector();
                        break;
                    case 'team-selection':
                        showImporter(false);
                        break;
                    case 'selector':
                        if (!document.getElementById('page-analysis').classList.contains('hidden')) {
                            pageAnalysis.classList.add('hidden');
                            pageSelector.classList.remove('hidden');
                            document.body.classList.remove('analysis-active');
                            APP_STATE.activePage = 'selector';
                            saveFullAppState();
                        }
                        break;
                }
            }
        }
        
        if (e.ctrlKey && !e.altKey) {
            switch(e.key.toLowerCase()) {
                case '1': if(APP_STATE.currentMatch) {e.preventDefault(); toggleColorEditor('home');} break;
                case '2': if(APP_STATE.currentMatch) {e.preventDefault(); toggleColorEditor('away');} break;
                case '3': if(APP_STATE.currentMatch) {e.preventDefault(); openFormationMenu('home');} break;
                case '4': if(APP_STATE.currentMatch) {e.preventDefault(); openFormationMenu('away');} break;
                case '5': if(APP_STATE.currentMatch) {e.preventDefault(); openRefereeMenu();} break;
                case 'g': if(APP_STATE.currentMatch) {e.preventDefault(); openAIGeneratorModal();} break;
                case 'z': e.preventDefault(); undoLastChange(); break;
                case 'r': e.preventDefault(); document.getElementById('reset-session-btn').click(); break;
            }
        }
    });
    window.addEventListener('keyup', (e) => { if (e.key === 'Control' || e.key === 'Shift') shortcutsMenu.classList.remove('is-visible'); });

    const pasteBoxOdds = document.getElementById('paste-box-odds');
    const allPasteBoxes = [pasteBoxOdds];

    allPasteBoxes.forEach(box => {
        if (box) {
            box.addEventListener('focus', () => {
                activePasteTarget = box.id.replace('paste-box-', '');
                allPasteBoxes.forEach(b => b.classList.remove('is-active'));
                box.classList.add('is-active');
            });
            box.addEventListener('blur', () => {
                setTimeout(() => {
                    if (document.activeElement !== box && !box.contains(document.activeElement)) {
                        if(activePasteTarget === box.id.replace('paste-box-', '')){
                            activePasteTarget = null;
                        }
                        box.classList.remove('is-active');
                    }
                }, 150);
            });
        }
    });
    document.addEventListener('paste', handleGlobalPaste);

    async function handleGlobalPaste(e) {
        if (!activePasteTarget) return;

        e.preventDefault();
        const items = e.clipboardData.items;
        const imageFiles = [];
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                const file = new File([blob], "pasted-image.png", { type: blob.type });
                imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            if (activePasteTarget === 'odds') {
                addOddsImages(imageFiles);
            }
        }
    }

    const oddsImageUpload = document.getElementById('odds-image-upload');
    if(oddsImageUpload) {
        oddsImageUpload.addEventListener('change', (e) => addOddsImages(e.target.files));
    }

    document.addEventListener('contextmenu', (e) => { if (e.target.closest('.player-marker')) return; e.preventDefault(); });

    const personalitySelect = document.getElementById('generator-personality-select');
    const personalityDescription = document.getElementById('personality-description');

    const updatePersonalityDescription = () => {
        if (personalitySelect && personalityDescription) {
            const selectedOption = personalitySelect.options[personalitySelect.selectedIndex];
            personalityDescription.textContent = selectedOption.dataset.description || '';
        }
    };

    if (personalitySelect) {
        personalitySelect.addEventListener('change', updatePersonalityDescription);
    }
    
    // --- INICIO CÓDIGO MODIFICADO (Stake Buttons) ---
    // El código anterior para 'generator-stake-required' (un slider) se elimina
    // porque el HTML (INCA STATS.html) usa botones.
    
    // Agregamos lógica para los botones de stake
    const stakeGrid = document.getElementById('stake-selector-grid');
    if (stakeGrid) {
        const stakeButtons = stakeGrid.querySelectorAll('.stake-card-button');
        
        // Asegurarnos de que un valor (ej. 10) esté seleccionado por defecto
        const defaultStakeButton = stakeGrid.querySelector('.stake-card-button[data-stake="10"]');
        if (defaultStakeButton) {
            defaultStakeButton.classList.add('selected');
        }

        stakeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Quitar 'selected' de todos los botones
                stakeButtons.forEach(btn => btn.classList.remove('selected'));
                // Añadir 'selected' al botón clickeado
                button.classList.add('selected');
            });
        });
    }
    // --- FIN CÓDIGO MODIFICADO ---

    window.openAIGeneratorModal = () => {
        if (!APP_STATE.currentMatch) { showToast("Primero abre la mesa de trabajo.", "error"); return; }
    
        const modal = document.getElementById('ai-generator-modal');
        const modalTitle = document.getElementById('ai-generator-modal-title');
        const refereeSelect = document.getElementById('generator-referee-select');
        const stageSelect = document.getElementById('generator-stage-select');
        const firstLegContainer = document.getElementById('first-leg-score-container');
        const leagueDayContainer = document.getElementById('league-stage-day-container');
        const leagueDaySelect = document.getElementById('league-stage-day-select');
        const classicContainer = document.getElementById('classic-matchups-container');
        const classicGrid = document.getElementById('classic-matchups-grid');

        const currentLeague = leagues.find(l => l.type === APP_STATE.currentLeagueType) || { name: 'Análisis' };
        modalTitle.textContent = `Finalizar y Generar Análisis (${currentLeague.name})`;

        stageSelect.innerHTML = '';
        leagueDaySelect.innerHTML = '';
        firstLegContainer.classList.add('hidden');
        leagueDayContainer.classList.add('hidden');
        stageSelect.parentElement.classList.add('hidden');
        if (classicContainer) classicContainer.classList.add('hidden');

        refereeSelect.innerHTML = '';
        Object.keys(APP_STATE.database.referees).sort().forEach(refName => {
            const option = document.createElement('option');
            option.value = refName;
            option.textContent = refName;
            if (refName === APP_STATE.currentMatch.referee) option.selected = true;
            refereeSelect.appendChild(option);
        });

        const uefaLeagues = ['champions', 'europa'];
        const standardLeagues = ['premier', 'laliga', 'seriea', 'ligue1'];
        const bundesligaLeague = 'bundesliga';
        const currentLeagueType = APP_STATE.currentLeagueType;

        if (uefaLeagues.includes(currentLeagueType)) {
            stageSelect.parentElement.classList.remove('hidden');
            const stages = ["Fase de Liga", "Play-off (Ida)", "Play-off (Vuelta)", "Octavos de Final (Ida)", "Octavos de Final (Vuelta)", "Cuartos de Final (Ida)", "Cuartos de Final (Vuelta)", "Semifinal (Ida)", "Semifinal (Vuelta)", "Final"];
            stages.forEach(stage => { const option = document.createElement('option'); option.textContent = stage; stageSelect.appendChild(option); });
            for (let i = 1; i <= 8; i++) { const option = document.createElement('option'); option.value = i; option.textContent = `Jornada ${i}`; leagueDaySelect.appendChild(option); }
            if (!stageSelect.dataset.listenerAttached) {
                stageSelect.addEventListener('change', (e) => { const value = e.target.value.toLowerCase(); firstLegContainer.classList.toggle('hidden', !value.includes('vuelta')); leagueDayContainer.classList.toggle('hidden', !value.includes('fase de liga')); });
                stageSelect.dataset.listenerAttached = 'true';
            }
            stageSelect.dispatchEvent(new Event('change'));

        } else if (standardLeagues.includes(currentLeagueType) || bundesligaLeague === currentLeagueType) {
            leagueDayContainer.classList.remove('hidden');
            const totalJornadas = (bundesligaLeague === currentLeagueType || currentLeagueType === 'ligue1') ? 34 : 38;
            for (let i = 1; i <= totalJornadas; i++) { const option = document.createElement('option'); option.value = i; option.textContent = `Jornada ${i}`; leagueDaySelect.appendChild(option); }
            if (classicContainer && classicGrid) {
                classicGrid.innerHTML = '';
                const classics = _.get(APP_STATE, 'database.classics', null);
                if (classics && Object.keys(classics).length > 0) {
                    const currentHome = APP_STATE.currentMatch.home;
                    const currentAway = APP_STATE.currentMatch.away;
                    const motivationTextarea = document.getElementById('generator-motivation-textarea');
                    let hasClassic = false;
                    for(const classicName in classics) {
                        const match = classics[classicName];
                        if (match.teams.includes(currentHome) && match.teams.includes(currentAway)) {
                            hasClassic = true;
                            const homeTeamData = APP_STATE.database.teams[currentHome];
                            const awayTeamData = APP_STATE.database.teams[currentAway];
                            if (homeTeamData && awayTeamData) {
                                const button = document.createElement('button');
                                button.type = 'button';
                                button.className = 'classic-button';
                                button.innerHTML = `<img src="${homeTeamData.logoUrl}" alt="${homeTeamData.name}"><span class="text-xs font-bold">${classicName}</span><img src="${awayTeamData.logoUrl}" alt="${awayTeamData.name}">`;
                                button.addEventListener('click', () => { motivationTextarea.value = (motivationTextarea.value ? motivationTextarea.value + '\n\n' : '') + match.review; document.querySelectorAll('#classic-matchups-grid .classic-button').forEach(b => b.classList.remove('selected')); button.classList.add('selected'); });
                                classicGrid.appendChild(button);
                            }
                        }
                    }
                    classicContainer.classList.toggle('hidden', !hasClassic);
                } else {
                    classicContainer.classList.add('hidden');
                }
            }
        } else {
            console.warn(`Tipo de liga no reconocido o no manejado: ${currentLeagueType}`);
        }
        
        document.getElementById('main-app-container').classList.add('hidden');
        modal.classList.remove('hidden');
        updatePersonalityDescription(); 
    };

});

// --- ============================================ ---
// --- INTEGRACIÓN CON LA API DE GEMINI ---
// --- ============================================ ---

function addOddsImages(files) {
    const previewGrid = document.getElementById('odds-preview-grid');
    const imageArray = uploadedOddsImages;
    const newFiles = Array.from(files);

    newFiles.forEach(file => {
        imageArray.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement('div');
            container.className = 'img-preview-container';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-preview';
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.className = 'img-delete-btn';
            deleteBtn.onclick = () => {
                const index = imageArray.indexOf(file);
                if (index > -1) imageArray.splice(index, 1);
                container.remove();
            };
            container.appendChild(img);
            container.appendChild(deleteBtn);
            previewGrid.appendChild(container);
        }
        reader.readAsDataURL(file);
    });
}

async function callAIWithRetry(payload, maxRetries = 3, timeout = 60000) {
    let attempt = 0;

    // ESTE ES EL ÚNICO CAMBIO: Pones el modelo que tú quieres
    let modelName = 'gemini-2.5-flash-preview-05-20'; 

    if (payload.contents && payload.contents[0] && payload.contents[0].parts) {
        const hasImages = payload.contents[0].parts.some(part => part.inlineData);
        if (hasImages) {
            console.log(`Payload con imágenes detectado, usando ${modelName}.`);
        } else {
            console.log(`Payload de solo texto detectado, usando ${modelName}.`);
        }
    }
    const apiUrl = `${GEMINI_API_URL_BASE}${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    while (attempt < maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) { const errorBody = await response.text(); console.error("API Error Response:", errorBody); throw new Error(`Error de API: ${response.status} ${response.statusText}.`); }
            const result = await response.json();
            const candidate = result.candidates?.[0];
            const textResponse = candidate?.content?.parts?.[0]?.text;
            if (textResponse) {
                const cleanedJson = textResponse.replace(/```json|```/g, '').trim();
                try { return JSON.parse(cleanedJson); } catch (jsonError) { console.error("Failed to parse JSON from AI response:", cleanedJson); throw new Error("La IA devolvió un formato JSON no válido."); }
            } else { const errorReason = candidate?.finishReason || 'No content'; console.error("AI Response Candidate:", candidate); throw new Error(`La IA no generó una respuesta de texto válida (Razón: ${errorReason}).`); }
        } catch (error) {
            clearTimeout(timeoutId);
            attempt++;
            console.warn(`Intento de llamada a la IA ${attempt}/${maxRetries} fallido: ${error.name === 'AbortError' ? 'Tiempo de espera agotado' : error.message}`);
            if (attempt >= maxRetries) { if (error.name === 'AbortError') { throw new Error("La solicitud a la IA tardó demasiado en responder. Inténtalo de nuevo."); } throw new Error(`No se pudo obtener una respuesta de la IA. ${error.message}`); }
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
        }
    }
}

// --- ============================================ ---
// --- FUNCIÓN REEMPLAZADA CON NUEVOS PARÁMETROS ---
// --- ============================================ ---
async function generateAndApplyAIPick() {
    const loadingContainer = document.getElementById('generator-loading-container');
    const progressBar = document.getElementById('generator-progress-bar');
    const loadingMessageSpan = document.getElementById('loading-message');
    const errorContainer = document.getElementById('generator-error-container');
    const errorMessageP = document.getElementById('generator-error-message');

    loadingContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    errorContainer.classList.add('hidden');

    const dynamicMessages = ["Analizando estadísticas clave...", "Evaluando impacto de bajas...", "Calculando probabilidades...", "Revisando historial...", "Consultando el oráculo del fútbol...", "Interpretando el Khipu...", "Ajustando predicciones...", "Generando lógica de apuesta..."];
    const animateProgress = (target, duration, message) => { return new Promise(resolve => { const interval = 200; const steps = duration / interval; let currentStep = 0; const updateInterval = setInterval(() => { currentStep++; const currentProgress = (currentStep / steps) * 100; progressBar.style.width = `${Math.min(currentProgress, target)}%`; const displayMessage = message.includes('Khipu AI') ? dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)] : message; loadingMessageSpan.textContent = `${displayMessage} (${Math.round(progressBar.style.width.slice(0, -1))}%)`; if (currentStep >= steps) { clearInterval(updateInterval); resolve(); } }, interval); }); };

    try {
        await animateProgress(20, 1000, 'Preparando datos');
        const homeTeamName = APP_STATE.currentMatch.home;
        const awayTeamName = APP_STATE.currentMatch.away;
        const refereeName = document.getElementById('generator-referee-select').value;
        const refereeStats = _.get(APP_STATE, ['database', 'referees', refereeName], {});
        const stageSelect = document.getElementById('generator-stage-select');
        const firstLegScore = document.getElementById('first-leg-score-input').value;
        const leagueDaySelector = document.getElementById('league-stage-day-select');
        const uefaLeagues = ['champions', 'europa'];
        const domesticLeagues = ['premier', 'laliga', 'seriea', 'ligue1', 'bundesliga'];
        const currentLeagueType = APP_STATE.currentLeagueType;
        let finalStage = stageSelect.value;
        if (domesticLeagues.includes(currentLeagueType)) { finalStage = `Jornada ${leagueDaySelector.value}`; } else if (uefaLeagues.includes(currentLeagueType) && stageSelect.value.toLowerCase().includes('fase de liga')) { finalStage = `Fase de Liga (Jornada ${leagueDaySelector.value})`; }
        const selectedPersonality = document.getElementById('generator-personality-select').value;
        
        // --- INICIO DE CAMBIOS ---
        // Objeto `contexto_humano` modificado
        
        // ¡NUEVA LÓGICA PARA LEER EL STAKE DESDE LOS BOTONES!
        const selectedStakeButton = document.querySelector('#stake-selector-grid .stake-card-button.selected');
        // Usamos 10 como valor por defecto si (por alguna razón) ninguno está seleccionado
        const stakeRequerido = selectedStakeButton ? selectedStakeButton.dataset.stake : "10"; 

        const contexto_humano = { 
            etapa_torneo: finalStage, 
            resultado_ida: stageSelect.value.toLowerCase().includes('vuelta') ? firstLegScore : "N/A", 
            condiciones: {}, 
            bajas: {},
            // Nuevos parámetros del pick
            parametros_pick: {
                tipo_pick: document.getElementById('generator-pick-type').value,
                cuota_minima: document.getElementById('generator-min-odds').value || "N/A",
                cuota_maxima: document.getElementById('generator-max-odds').value || "N/A",
                // ¡AQUÍ ESTÁ EL CAMBIO!
                stake_requerido: stakeRequerido
            }
        };
        
        // ELIMINADO: Clima y Estado del Campo

        // Se mantienen Motivación, Bajas y Apuntes
        const motivacion = document.getElementById('generator-motivation-textarea').value; 
        if(motivacion) contexto_humano.condiciones.motivacion = motivacion;
        
        const bajasLocal = document.getElementById('generator-absences-textarea-home').value; 
        if(bajasLocal) contexto_humano.bajas.local = bajasLocal;
        
        const bajasVisitante = document.getElementById('generator-absences-textarea-away').value; 
        if(bajasVisitante) contexto_humano.bajas.visitante = bajasVisitante;
        
        const apuntes = document.getElementById('generator-verdict-textarea').value; 
        if(apuntes) contexto_humano.apuntes_analista = apuntes;
        
        contexto_humano.personalidad_ia = selectedPersonality;
        // --- FIN DE CAMBIOS ---

        await animateProgress(40, 1000, 'Contextualizando partido');
        const getStatsSummary = (teamName, location) => { const teamStats = findTeamStats(teamName); const stats = location === 'home' ? teamStats.home_stats : teamStats.away_stats; if (!stats) return {}; return { goles_pp: stats.goals_per_game, goles_encajados_pp: stats.goals_conceded_per_game, remates_pp: stats.shots_per_game, remates_puerta_pp: stats.shots_on_target_per_game, faltas_pp: stats.fouls_per_game, corners_pp: stats.corners_per_game, tarjetas_amarillas_pp: stats.yellow_cards_per_game }; };
        const stats_summary = { local: getStatsSummary(homeTeamName, 'home'), visitante: getStatsSummary(awayTeamName, 'away'), arbitro: { nombre: refereeName, faltas_pp: refereeStats.fouls_per_game, amarillas_pp: refereeStats.yellows_per_game, rojas_pp: refereeStats.reds_per_game } };
        
        const getTeamRosterData = (teamName, lineup) => {
            const fullRoster = _.get(APP_STATE, ['database', 'players', teamName, 'plantilla'], []);
            const starterNames = new Set(lineup.map(p => p.name));
            const starters = lineup.map(starterPlayer => fullRoster.find(p => p.name === starterPlayer.name) || starterPlayer);
            const substitutes = fullRoster.filter(p => !starterNames.has(p.name));
            return { starters, substitutes };
        };

        const homeRoster = getTeamRosterData(homeTeamName, APP_STATE.currentMatch.homeTeam.lineup);
        const awayRoster = getTeamRosterData(awayTeamName, APP_STATE.currentMatch.awayTeam.lineup);

        const alineaciones = { 
            local: { formacion: APP_STATE.currentMatch.homeTeam.formation, once_titular: homeRoster.starters, banca_suplentes: homeRoster.substitutes }, 
            visitante: { formacion: APP_STATE.currentMatch.awayTeam.formation, once_titular: awayRoster.starters, banca_suplentes: awayRoster.substitutes } 
        };

        const payload = { contents: [{ parts: [] }] };
        const fundamentalCount = 2;
        
        // --- ============================================ ---
        // ---           INICIO DEL PROMPT MODIFICADO       ---
        // --- ============================================ ---
        const prompt = `**Misión:** Eres Khipu-Pro, una IA de análisis táctico de élite. Tu objetivo es generar un 'pick' (predicción) profesional y fundamentado, respondiendo únicamente en formato JSON.

**Datos Clave Recibidos:**
1.  **Contexto Humano (Decisivo):** ${JSON.stringify(contexto_humano)} 
    * (Prioridad MÁXIMA. Incluye apuntes, bajas, motivación y los **parámetros del pick** deseados: tipo, cuotas y stake).
2.  **Datos de Plantillas (Crucial):** ${JSON.stringify(alineaciones)}
    * (Incluye objetos JSON de los 11 titulares y los suplentes de ambos equipos).
3.  **Resumen Estadístico (Referencia):** ${JSON.stringify(stats_summary)} 
    * (Estadísticas generales del torneo. Usar solo como referencia secundaria).
4.  **Imágenes de Cuotas (Visual):** * (Se han adjuntado imágenes de mercados de apuestas. Analízalas visualmente).

**Reglas Críticas de Análisis:**

1.  **PRIORIDAD DE DATOS:** Tu lógica DEBE basarse 100% en el **Contexto Humano** y los **Datos de Plantillas**. Los apuntes del analista y las bajas anulan cualquier estadística histórica.

2.  **RESPETAR PARÁMETROS DEL PICK:** Debes generar un 'pick' que cumpla OBLIGATORIAMENTE con los \`parametros_pick\` definidos por el analista (tipo, cuota_minima, cuota_maxima, stake_requerido). 
    * Tu 'pick' debe tener una 'odds' (cuota) que esté dentro del rango [cuota_minima, cuota_maxima].
    * Tu 'pick' debe ser del 'tipo_pick' solicitado (Simple o Bet Builder).
    * El 'stake' que devuelvas debe ser el 'stake_requerido' exacto que te pasó el analista.

3.  **ANÁLISIS VISUAL DE IMÁGENES (NO OCR):**
    * Analiza todas las imágenes de cuotas proporcionadas. **No hagas OCR**. "Mira" las imágenes para entender qué mercados (ej. "remates", "tiros a puerta", "laterales") tienen cuotas disponibles.
    * Usa este contexto visual para **inspirar** tu 'pick' si encuentras valor, siempre respetando los parámetros del punto 2.
    * Si las imágenes no son claras o no aportan valor, genera el pick basándote en mercados principales (Resultado, Goles, Córners).

4.  **Personalidad del Análisis:** Adopta estrictamente el rol de: '${selectedPersonality}'. Tu análisis y la redacción de los 'fundamentals' deben reflejarlo fielmente.

5.  **Fundamentals:** Crea EXACTAMENTE ${fundamentalCount} 'fundamentals'. Cada 'desc' debe ser conciso (máx. 4-5 líneas), justificando el pick.

6.  **SALIDA OBLIGATORIA:** Responde **únicamente con el objeto JSON**, sin texto extra ni marcas de formato \`\`\`json\`\`\`.

**Formato JSON Requerido:**
{
  "pick": "string",
  "odds": "string",
  "stake": "number",
  "fundamentals": [
    { "title": "string", "desc": "string" },
    { "title": "string", "desc": "string" }
  ]
}`;
        // --- ============================================ ---
        // ---            FIN DEL PROMPT MODIFICADO           ---
        // --- ============================================ ---
        
        payload.contents[0].parts.push({ text: prompt });
        if (uploadedOddsImages.length > 0) { for (const imageFile of uploadedOddsImages) { const base64Data = await imageFileToDataURL(imageFile); const base64Image = base64Data.split(',')[1]; payload.contents[0].parts.push({ inlineData: { mimeType: imageFile.type, data: base64Image } }); } }
        const aiPromise = callAIWithRetry(payload);
        await animateProgress(90, 8000, 'Consultando a Khipu AI');
        const jsonResponse = await aiPromise;
        if (!jsonResponse) throw new Error("La IA no generó una respuesta JSON válida.");
        await animateProgress(95, 500, 'Compilando análisis');
        saveState();
        APP_STATE.currentMatch.pick.market = jsonResponse.pick;
        APP_STATE.currentMatch.odds = jsonResponse.odds;
        APP_STATE.currentMatch.fundamentals = jsonResponse.fundamentals;
        
        // --- INICIO DE CAMBIOS ---
        // Usar el stake devuelto por la IA (que debe ser el mismo que el 'stake_requerido')
        const stakeValue = parseInt(jsonResponse.stake, 10);
        // Guardar el score basado en el stake, o simplemente el stake
        APP_STATE.currentMatch.verdict_score = stakeValue >= 25 ? 95 : stakeValue >= 85 ? 20 : stakeValue >= 75 ? 15 : stakeValue >= 65 ? 10 : 50; // Mapeo inverso
        // --- FIN DE CAMBIOS ---

        APP_STATE.currentMatch.referee = document.getElementById('generator-referee-select').value;
        APP_STATE.analysisGenerated = true;
        
        await animateProgress(100, 300, 'Análisis Completado');
        
        setTimeout(() => { 
            renderAll(APP_STATE.currentMatch); 
            
            // --- INICIO DE CAMBIOS ---
            // Asegurarse de que el stake visual coincida exactamente con el stake retornado por la IA
            const mainContainer = document.getElementById('main-app-container');
            updatePick(mainContainer, jsonResponse.odds, stakeValue); // Usar stakeValue directamente
            // --- FIN DE CAMIOS ---

            closeAIGeneratorModal(); 
            document.getElementById('main-app-container').classList.remove('hidden'); 
            showToast("Análisis generado con éxito", "success"); 
        }, 800);
    } catch (error) {
        console.error("Error detallado al generar el análisis con IA:", error);
        errorMessageP.textContent = `Error al generar análisis: ${error.message}`;
        errorContainer.classList.remove('hidden');
        loadingContainer.classList.add('hidden');
    }
}
// FIN DE LA FUNCIÓN REEMPLAZADA


function closeAIGeneratorModal() {
    const modal = document.getElementById('ai-generator-modal');
    modal.classList.add('hidden');
    if(APP_STATE.currentMatch && APP_STATE.activePage === 'analysis'){
        document.getElementById('main-app-container').classList.remove('hidden');
        document.getElementById('main-app-container').classList.add('flex');
    }
}

function imageFileToDataURL(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }