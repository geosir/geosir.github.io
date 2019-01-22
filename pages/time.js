let time_page_interval = null;

function timePageStart() {
    const inception = new Date(1496507400000);
    time_page_interval = setInterval(() => {
        const now = new Date();

        const mspersec = 1000;
        const msperminute = mspersec * 60;
        const msperhour = msperminute * 60;
        const msperday = msperhour * 24;
        const msperyear = msperday * 365.25;

        let delta = now.getTime() - inception.getTime();

        const years = Math.floor(delta / msperyear);
        delta -= years * msperyear;
        const days = Math.floor(delta / msperday);
        delta -= days * msperday;
        const hours = Math.floor(delta / msperhour);
        delta -= hours * msperhour;
        const minutes = Math.floor(delta / msperminute);
        delta -= minutes * msperminute;
        const seconds = Math.floor(delta / mspersec);
        // delta -= seconds * mspersec;
        // const milleseconds = delta;

        document.getElementById("timestring").innerHTML = years + " years, " + days + " days, "
            + hours + " hours, " + minutes + " minutes, "
            + seconds + " seconds...";

    }, 10);
}

function timePageStop() {
    if (time_page_interval) clearInterval(time_page_interval);
}