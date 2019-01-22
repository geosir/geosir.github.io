// Stroll: Simple Walkable Websites - version 0.1
// Copyright (c) 2019 George Moe
// License: MIT (https://opensource.org/licenses/MIT)

function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
}


class Stroll {
    constructor(titlebase, strollmap, index, trackingID = null) {
        // Setup state
        this.titlebase = titlebase;
        this.trackingID = trackingID;
        this.strollmap = strollmap;
        this.index = index;
        this.current = null;
        this.loaded = [];
        this.isSwiping = false;
        this.swipeStart = null;
        this.swipeStartTime = null;
        this.swipeDir = null;
        this.displacement = {x: 0, y: 0};
        this.isAnimating = false;

        this.view = {
            root: document.getElementById("stroll"),
            main: document.getElementById("stroll-main"),
            up: document.getElementById("stroll-up"),
            down: document.getElementById("stroll-down"),
            left: document.getElementById("stroll-left"),
            right: document.getElementById("stroll-right"),
            nav: document.getElementById("stroll-nav"),
            title: document.querySelector("title"),
        };

        this.offsetView(0, 0);
        this.setupListeners();

        // toggleFullScreen();

        window.onpopstate = () => {
            this.handleRoute()
        };

        if (!this.fixPath(window.location.pathname)) {
            const path = this.parsePath(window.location.pathname);
            if (path === "") {
                this.focus(this.index, false, true);
            } else {
                this.focus(path, false, true);
            }
        }
    }

    // ===== Routing =====

    // TODO: Make recursive to allow for SubStrolls
    handleRoute() {
        this.loaded = [];
        if (history.state) {
            if (history.state && history.state.name) {
                this.focus(history.state.name, false);
            }
        }
    }

    fixPath(path) {
        if (path !== "/" && path[path.length - 1] === "/") {
            window.location.replace(path.substr(0, path.length - 1));
            return true;
        }
        return false;
    }

    parsePath(path) {
        path = (path[0] === "/") ? path.substr(1) : path;
        path = (path[path.length - 1] === "/") ? path.substr(0, path.length - 1) : path;
        return path;
    }

    // ===== Pages and Page Loading =====

    getPage(href) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (xhr.response.includes("404POISON")) {
                        console.error("Stroll: File " + href + " does not exist.");
                        reject(404);
                    }
                    console.info("Stroll: Got " + href);
                    resolve(xhr.response);
                } else {
                    console.error("Stroll: Problem getting " + href + ": " + xhr.status + ": " + xhr.statusText);
                    reject(xhr.status);
                }
            };
            xhr.ontimeout = () => {
                console.error("Stroll: Timeout while getting " + href + ".");
                reject('timeout');
            };
            xhr.open('GET', href);
            xhr.send()
        });
    }

    async focus(name, push = true, replace = false) {
        console.info("Stroll: Focus " + name);
        const page = this.strollmap[name];
        if (!page || page.noroute) {
            console.error("Stroll: Route " + name + "not found.");
            await this.focus("notfound", false, false);
            return;
        }

        if (gtag && this.trackingID) {
            gtag('config', this.trackingID, {'page_path': name});
        }

        // Update state
        this.prev = this.current;
        this.current = name;

        this.updateStrollnav(page);
        this.view.title.innerHTML = `${page.hname} | ${this.titlebase}`;
        await this.load(name, this.view.main);

        // Handle behavior
        switch (page.type) {
            case "link":
                window.location.replace(page.href);
                break;
            case "page":
                switch (page.mode) {
                    case "article":
                        this.view.root.className += " strollarticle";
                        break;
                    default:
                        this.view.root.className = "";
                        break;
                }

                if (page.script) {
                    let newscript = document.createElement('script')

                }

                if (push) window.history.pushState({name: name, type: "page"}, name.hname, `/${name}`);
                if (replace) window.history.replaceState({name: name, type: "page"}, name.hname, `/${name}`);

                if (page.up) this.load(page.up, this.view.up, true);
                if (page.down) this.load(page.down, this.view.down, true);
                if (page.left) this.load(page.left, this.view.left, true);
                if (page.right) this.load(page.right, this.view.right, true);
                break;
            default:
                break;
        }
    }

    pagePreMoveHook(name) {
        const page = this.strollmap[name];
        if (!page) {
            console.error("Stroll: pagePreMoveHook: " + name + " is not defined.");
            return false;
        }
        switch (page.type) {
            case "link":
                window.location = page.href;
                return false;
            default:
                return true;
        }
    }

    async load(name, target, force = false) {
        if (this.loaded.indexOf(name) > -1 && !force) return;

        const page = this.strollmap[name];

        // Handle page type
        try {
            switch (page.type) {
                case "link":
                    target.innerHTML = `<div class=\"strollcontent strollcontent-centered\"><h3><a href="${page.href}">${page.href}</a></h3><div>`;
                    break;
                case "page":
                    target.innerHTML = await this.getPage(page.href);
                    break;
                default:
                    throw Error("Stroll: Unknown page type `" + page.type + "`.");
            }

            target.setAttribute("data-page", name);
            if (this.loaded.indexOf(name) < 0) this.loaded.push(name);
        } catch (e) {
            console.error(e);
        }
    }

    unload(target) {
        const name = target.getAttribute("data-page");
        if (!name) return;
        target.innerHTML = "";
        target.removeAttribute("data-page");
        if (this.loaded.indexOf(name) > -1) this.loaded.splice(this.loaded.indexOf(name), 1);
    }

    async updateStrollnav(page) {
        const hasdir = {
            up: page.up && this.strollmap[page.up],
            down: page.down && this.strollmap[page.down],
            left: page.left && this.strollmap[page.left],
            right: page.right && this.strollmap[page.right]
        };

        const navtext = {
            up: `${hasdir.up ? this.strollmap[page.up].hname : "&nbsp"}`,
            down: `${hasdir.down ? this.strollmap[page.down].hname : "&nbsp"}`,
            left: `${hasdir.left ? this.strollmap[page.left].hname : "&nbsp"}`,
            right: `${hasdir.right ? this.strollmap[page.right].hname : "&nbsp"}`
        }

        this.view.nav.innerHTML = '<table class="strollnav">' +
            `<tr><td></td><td colspan="3" class="action up">${navtext.up}</td><td></td></tr>` +
            `<tr><td rowspan="3" class="action left">${navtext.left}</td>` +
            `<td></td><td class="arrow">${hasdir.up ? "&uarr;" : "&nbsp"}</td><td></td>` +
            `<td rowspan="3" class="action right">${navtext.right}</td></tr>` +
            `<tr><td class="arrow">${hasdir.left ? "&larr;" : "&nbsp"}</td>` +
            `<td class="action middle"><b>${page.hname}</b></td>` +
            `<td class="arrow">${hasdir.right ? "&rarr;" : "&nbsp"}</td></tr>` +
            `<td></td><td class="arrow">${hasdir.down ? "&darr;" : "&nbsp"}</td><td></td>` +
            `<tr><td></td><td colspan="3" class="action down">${navtext.down}</td><td></td></tr>` +
            "</table>";

        const navup = this.view.nav.querySelector(".strollnav .up");
        const navdown = this.view.nav.querySelector(".strollnav .down");
        const navleft = this.view.nav.querySelector(".strollnav .left");
        const navright = this.view.nav.querySelector(".strollnav .right");

        if (page.up) navup.onclick = () => this.pageMove("up");
        else navup.onclick = undefined;
        if (page.down) navdown.onclick = () => this.pageMove("down");
        else navdown.onclick = undefined;
        if (page.left) navleft.onclick = () => this.pageMove("left");
        else navleft.onclick = undefined;
        if (page.right) navright.onclick = () => this.pageMove("right");
        else navright.onclick = undefined;
    }

    // ===== Swipe and Offset =====

    offsetView(offx, offy) {
        this.view.main.style.top = `${offy}px`;
        this.view.main.style.left = `${offx}px`;

        this.view.up.style.top = `calc(${offy}px - 100vh)`;
        this.view.up.style.left = `${offx}px`;

        this.view.down.style.top = `calc(${offy}px + 100vh)`;
        this.view.down.style.left = `${offx}px`;

        this.view.left.style.top = `${offy}px`;
        this.view.left.style.left = `calc(${offx}px - 100vw)`;

        this.view.right.style.top = `${offy}px`;
        this.view.right.style.left = `calc(${offx}px + 100vw)`;

        this.displacement = {x: offx, y: offy};
    }

    setupListeners() {
        const boundHandleSwipeStart = this.handleSwipeStart.bind(this);
        const boundHandleSwipeEnd = this.handleSwipeEnd.bind(this);
        const boundHandleSwipeMove = this.handleSwipeMove.bind(this);
        const boundHandleArrowKey = this.handleArrowKey.bind(this);
        const boundHandleScroll = this.nullifySwipe.bind(this);

        this.view.root.addEventListener("touchstart", boundHandleSwipeStart);
        this.view.root.addEventListener("touchend", boundHandleSwipeEnd);
        this.view.root.addEventListener("touchcancel", boundHandleSwipeEnd);
        this.view.root.addEventListener("touchmove", boundHandleSwipeMove);
        this.view.root.addEventListener("scroll", boundHandleScroll, true);

        // Mouse drag support
        // this.view.root.addEventListener("mousedown", boundHandleSwipeStart);
        // this.view.root.addEventListener("mouseup", boundHandleSwipeEnd);
        // this.view.root.addEventListener("mousemove", boundHandleSwipeMove);

        document.addEventListener("keydown", boundHandleArrowKey);
    }

    nullifySwipe(e) {
        this.offsetView(0, 0);
        this.resetSwipe();
    }

    handleSwipeStart(e) {
        this.isSwiping = true;
        let pos = e;
        if (e.type === "touchstart") pos = e.changedTouches[0];
        this.swipeStart = {x: pos.pageX, y: pos.pageY};
        this.swipeStartTime = new Date();
        this.swipeDir = null;
        this.displacement = {x: 0, y: 0};
    }

    handleSwipeEnd(e) {
        if (!this.isSwiping) return;

        if (this.displacement.y > window.innerHeight * 0.2) {
            this.pageMove("up");
        } else if (this.displacement.y < -window.innerHeight * 0.2) {
            this.pageMove("down");
        } else if (this.displacement.x > window.innerWidth * 0.2) {
            this.pageMove("left");
        } else if (this.displacement.x < -window.innerWidth * 0.2) {
            this.pageMove("right");
        } else {
            this.animateToDisplacement(this.displacement, {x: 0, y: 0}, 200);
        }

        this.resetSwipe();
    }

    resetSwipe() {
        this.isSwiping = false;
        this.swipeStart = null;
        this.swipeStartTime = null;
        this.swipeDir = null;
        this.displacement = {x: 0, y: 0};
    }

    handleSwipeMove(e) {
        if (!this.isSwiping) return;

        let pos = e;
        if (e.type === "touchmove") pos = e.changedTouches[0];
        const displacement = {x: pos.pageX - this.swipeStart.x, y: pos.pageY - this.swipeStart.y};
        const page = this.strollmap[this.current];

        if ((Math.abs(displacement.x) > Math.abs(displacement.y) || this.swipeDir === "h") && this.swipeDir !== "v") {
            if (Math.abs(displacement.x) > window.innerWidth * 0.25) {
                this.swipeDir = "h";
            }
            if (displacement.x < 0 && !page.right) return;
            if (displacement.x > 0 && !page.left) return;
            this.displacement = {x: displacement.x, y: 0};
        } else {
            if (Math.abs(displacement.y) > window.innerHeight * 0.25) {
                this.swipeDir = "v";
            }
            if (displacement.y < 0 && !page.down) return;
            if (displacement.y > 0 && !page.up) return;
            this.displacement = {x: 0, y: displacement.y};
        }

        this.displacement.x = Math.max(Math.min(window.innerWidth, this.displacement.x), -window.innerWidth);
        this.displacement.y = Math.max(Math.min(window.innerHeight, this.displacement.y), -window.innerHeight);
        this.offsetView(this.displacement.x, this.displacement.y);
    }

    handleArrowKey(e) {
        const keycode = e.key || e.keyIdentifier || e.keyCode || e.which;
        switch (keycode) {
            case "ArrowUp":
            case 38:
                this.pageMove("up");
                break;
            case "ArrowDown":
            case 40:
                this.pageMove("down");
                break;
            case "ArrowLeft":
            case 37:
                this.pageMove("left");
                break;
            case "ArrowRight":
            case 39:
                this.pageMove("right");
                break;
            default:
                return;
        }
    }

    animateToDisplacement(start, end, time, callback = undefined, steptime = 10) {
        this.isAnimating = true;

        if (time < steptime) {
            this.offsetView(end.x, end.y);
            this.isAnimating = false;
            if (callback) callback();
            return;
        }

        const xstep = (end.x - start.x) / time * steptime;
        const ystep = (end.y - start.y) / time * steptime;
        const nextstart = {x: start.x + xstep, y: start.y + ystep};
        this.offsetView(nextstart.x, nextstart.y);
        setTimeout(() => {
            this.animateToDisplacement(nextstart, end, time - steptime, callback, steptime)
        }, steptime);
    }

    makeCenter(target) {
        switch (target) {
            case this.view.main:
                break;
            case this.view.up: {
                // Unload
                this.unload(this.view.down);
                this.unload(this.view.left);
                this.unload(this.view.right);

                // ID shuffle
                const mainid = this.view.main.id;
                this.view.main.id = this.view.down.id;
                this.view.down.id = this.view.up.id;
                this.view.up.id = mainid;

                // Assignment shuffle
                const maincont = this.view.main;
                this.view.main = this.view.up;
                this.view.up = this.view.down;
                this.view.down = maincont;

                // Update displacement
                this.displacement = {
                    x: this.displacement.x,
                    y: this.displacement.y - window.innerHeight
                };
                break;
            }
            case this.view.down: {
                // Unload
                this.unload(this.view.up);
                this.unload(this.view.left);
                this.unload(this.view.right);

                // ID shuffle
                const mainid = this.view.main.id;
                this.view.main.id = this.view.up.id;
                this.view.up.id = this.view.down.id;
                this.view.down.id = mainid;

                // Assignment shuffle
                const maincont = this.view.main;
                this.view.main = this.view.down;
                this.view.down = this.view.up;
                this.view.up = maincont;

                // Update displacement
                this.displacement = {
                    x: this.displacement.x,
                    y: this.displacement.y + window.innerHeight
                };
                break;
            }
            case this.view.left: {
                // Unload
                this.unload(this.view.up);
                this.unload(this.view.down);
                this.unload(this.view.right);

                // ID shuffle
                const mainid = this.view.main.id;
                this.view.main.id = this.view.right.id;
                this.view.right.id = this.view.left.id;
                this.view.left.id = mainid;

                // Assignment shuffle
                const maincont = this.view.main;
                this.view.main = this.view.left;
                this.view.left = this.view.right;
                this.view.right = maincont;

                // Update displacement
                this.displacement = {
                    x: this.displacement.x - window.innerWidth,
                    y: this.displacement.y
                };
                break;
            }
            case this.view.right: {
                // Unload
                this.unload(this.view.up);
                this.unload(this.view.down);
                this.unload(this.view.left);

                // ID shuffle
                const mainid = this.view.main.id;
                this.view.main.id = this.view.left.id;
                this.view.left.id = this.view.right.id;
                this.view.right.id = mainid;

                // Assignment shuffle
                const maincont = this.view.main;
                this.view.main = this.view.right;
                this.view.right = this.view.left;
                this.view.left = maincont;

                // Update displacement
                this.displacement = {
                    x: this.displacement.x + window.innerWidth,
                    y: this.displacement.y
                };
                break;
            }
            default:
                break;
        }
        this.offsetView(this.displacement.x, this.displacement.y);
    }

    pageMove(direction) {
        if (this.isAnimating) return;
        const page = this.strollmap[this.current];
        let target = null;
        let nextpage = this.current;
        switch (direction) {
            case "up":
                target = this.view.up;
                nextpage = page.up;
                break;
            case "down":
                target = this.view.down;
                nextpage = page.down;
                break;
            case "left":
                target = this.view.left;
                nextpage = page.left;
                break;
            case "right":
                target = this.view.right;
                nextpage = page.right;
                break;
            default:
                return;
        }

        let animationCallback = () => null;
        if (nextpage) {
            if (this.pagePreMoveHook(nextpage)) {
                this.makeCenter(target);
                animationCallback = () => this.focus(nextpage);
            }
        }
        this.animateToDisplacement(this.displacement, {x: 0, y: 0}, 200, animationCallback);
    }
}