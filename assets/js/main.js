// DOM
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const originLocation = location.origin;
const contextPath = originLocation.includes("github.io") ?
    `${originLocation}/music-app/` : `${originLocation}/`;

const songsList = $(".songs__list");
const audio = $("#audio");
const cd = $(".header__cd");
const cdThumb = $(".header__cd-thumb");
const headingSong = $(".header__heading-song");
const headingSinger = $(".header__heading-singer");
const btnPlay = $(".btn-play");
const audioProgress = $(".player__progress-seek");
const btnYoutube = $(".btn-youtube");
const btnDownload = $(".btn-download");
const inpSearch = $(".songs__searchbar");
const timerCurrent = $(".player__progress-time-curent");
const timerEnd = $(".player__progress-time-end");
const songs = $(".songs");
const btnShowCd = $(".header__cd-show");

// Database
let audiosDb = [];
let settingsDb = {};

(async (callback) => {
    await fetch(`${contextPath}db/audios.json`)
        .then((resp) => resp.json()).then((json) => {
            audiosDb = json;
            return;
        });
    await fetch(`${contextPath}db/settings.json`)
        .then((resp) => resp.json())
        .then((json) => {
            settingsDb = json;
            return;
        });
    callback();
})(start);

const app = {
    songs: [],
    settings: {},
    currenPlaylistIndex: 0,
    currentSong: {},
    init: function () {
        this.loadSongs(audiosDb);
        this.initSettings(settingsDb);
        this.initRender();
        this.initHandler();
    },
    loadSongs: function (audiosDb) {
        this.songs = audiosDb.map(a => {
            a.path = `${contextPath}${a.path}`;
            a.thumb = `${contextPath}${a.thumb}`;
            return a;
        });
    }, initSettings(settingsDb) {
        this.settings = settingsDb;
        this.loadCurrentSong();
    },
    loadCurrentSong: function () {
        this.currentSong = this.songs.find(song => song.id === this.settings.currentSongId);
    },
    initRender: function () {
        this.renderSongs();
        this.renderCurrentSong();
    },
    renderSongs: function () {
        let i = 0;
        const htmls = this.songs.map(song =>
            `<li class="songs__list-item" song-id="${i++}">
                <img class="songs__list-item-thumb" 
                style="background-image: url('${song.thumb}');">
                <div class="songs__list-item-detail">
                    <h3 class="songs__list-item-detail-name">${song.name}</h3>
                    <h4 class="songs__list-item-detail-singer">${song.singer}</h4>
                </div>
            </li>`);
        songsList.innerHTML = htmls.join("");
    },
    renderCurrentSong() {
        cdThumb.style.backgroundImage = `url(${this.currentSong.thumb})`;
        headingSong.textContent = this.currentSong.name;
        headingSinger.textContent = this.currentSong.singer;
        audio.src = this.currentSong.path;
        btnYoutube.href = this.currentSong.youtube;
        $(`.songs__list-item.active`)?.classList.remove("active");
        $(`.songs__list-item[song-id='${this.currenPlaylistIndex}']`)?.classList.add("active");
        timerCurrent.textContent = secondsToMinutesAndSeconds(0);
        timerEnd.textContent = secondsToMinutesAndSeconds(audio.duration);
    },
    initHandler: function () {
        let _this = this;

        // Play button event
        btnPlay.onclick = () => {
            if (_this.settings.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }

        // Download button event
        btnDownload.onclick = () => {
            fetch(_this.currentSong.path)
                .then(resp => resp.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    // the filename you want
                    a.download = `${_this.currentSong.name} - ${_this.currentSong.singer}`;
                    // document.body.appendChild(a);
                    a.click();
                    // window.URL.revokeObjectURL(url);
                })
                .catch(() => alert('oh no!'));
        }

        // Song items event
        let songItems = $$(".songs__list-item");
        songItems.forEach(songItem => {
            songItem.onclick = () => {
                let oldIndex = _this.currentIndex;
                _this.currenPlaylistIndex = songItem.getAttribute("song-id");
                _this.settings.currentSongId = _this.songs[_this.currenPlaylistIndex].id;
                _this.loadCurrentSong();
                _this.renderCurrentSong();
                audio.play();
            }
        });
        // const cdThumbAnimation = cdThumb.animate([{ transform: "" }],
        //     { duration: 16000, iterations: Infinity });
        // inpSearch
        btnShowCd.onclick = (e) => {
            cd.style.height = "160px";
            cd.style.width = "160px";
            btnShowCd.style.width = "0";
            btnShowCd.style.height = "0";
            btnShowCd.style.fontSize = "0";
        }

        inpSearch.onfocus = () => {
            let height = songsList.offsetHeight;
            songsList.style.height = `${height + cd.offsetHeight}px`;

            cd.animate([{
                width: `${cd.offsetWidth}px`
                , height: `${cd.offsetHeight}px`
                , opacity: "1"
            },
            { width: "0px", height: "0px", opacity: "0" }],
                { duration: 500 });
            cd.style.height = "0";
            cd.style.width = "0";
            btnShowCd.style.height = "16px";
            btnShowCd.style.width = "100px";
            btnShowCd.style.fontSize = "16px";
        }

        inpSearch.oninput = (e) => {
            let keyword = e.target.value;
            keyword = keyword.toLowerCase();
            let result = this.songs.filter(song => song.name.toLowerCase().includes(keyword)
                || song.singer.toLowerCase().includes(keyword));
            this.songs.forEach((s, i) => {
                let item = $(`.songs__list-item[song-id='${i}']`);
                if (!result.includes(s)) {
                    item.style.display = "none";
                } else {
                    item.style.display = "flex";
                }
            });
        }

        // Audio progress event
        audioProgress.onchange = (e) => {
            audio.currentTime = e.target.value / 1000 * audio.duration;
            timerCurrent.textContent = secondsToMinutesAndSeconds(audio.currentTime);
        }

        // Audio event
        audio.onloadedmetadata = () => {
            timerEnd.textContent = secondsToMinutesAndSeconds(audio.duration);
        }
        audio.onplay = () => {
            _this.settings.isPlaying = true;
            btnPlay.classList.add("playing");
        }
        audio.onpause = () => {
            _this.settings.isPlaying = false;
            btnPlay.classList.remove("playing");
        }
        audio.ontimeupdate = () => {
            audioProgress.value = audio.currentTime / audio.duration * 1000;
        }
    },
    start: function () {
        this.init();
    }
}

function start() {
    app.start();
}

function secondsToMinutesAndSeconds(seconds) {
    seconds = !seconds ? 0 : seconds;
    let minutes = Number.parseInt(seconds / 60);
    seconds = Number.parseInt(seconds % 60);
    seconds = seconds >= 10 ? `${seconds}` : `0${seconds}`;
    minutes = minutes >= 10 ? `${minutes}` : `0${minutes}`;
    return `${minutes}:${seconds}`
}