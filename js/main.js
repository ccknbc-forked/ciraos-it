
/*
 * ********* main.js ********** *
 */

/*
 * scroll-down
 */

/* $('#scrolldown').click(
    function () {
        $('html,body').animate({
            scrollTop: document.getElementById('content')[0].scrollHeight
        }, 2000); return false;
    }); */

/*
 * install cw
 */
if (!!navigator.serviceWorker) {
    if (localStorage.getItem('cw_installed') !== 'true') { window.stop(); }
    navigator.serviceWorker.register('/cw.js?t=' + new Date().getTime()).then(async (registration) => {
        if (localStorage.getItem('cw_installed') !== 'true') {
            const conf = () => {
                console.log('[CW] Installing Success,Configuring...');
                fetch('/cw-cgi/api?type=config')
                    .then(res => res.text())
                    .then(text => {
                        if (text === 'ok') {
                            console.log('[CW] Installing Success,Configuring Success,Starting...');
                            localStorage.setItem('cw_installed', 'true');
                            window.location.reload();
                        } else {
                            console.warn('[CW] Installing Success,Configuring Failed,Sleeping 200ms...');
                            setTimeout(() => {
                                conf()
                            }, 200);
                        }
                    }).catch(err => {
                        console.log('[CW] Installing Success,Configuring Error,Exiting...');
                    });
            }
            setTimeout(() => {
                conf()
            }, 50);
        }
    }).catch(err => {
        console.error('[CW] Installing Failed,Error: ' + err.message);
    })
} else { console.error('[CW] Installing Failed,Error: Browser not support service worker'); }

/*
 * auto-update.cw
 */
; (async (updateSWDelay, updateConfigDelay) => {
    const LSDB = {
        read: (key) => {
            return localStorage.getItem(key);
        },
        write: (key, value) => {
            localStorage.setItem(key, value);
        }
    }
    async function updateSW() {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(async registrations => {
                for (let registration of registrations) {
                    await registration.unregister();
                }
                console.log(`Unregistered service workers`);
            }).then(() => {
                //register new service worker in /cw.js
                navigator.serviceWorker.register('/cw.js').then(async registration => {
                    console.log(`Registered service worker`);
                    await registration.update();
                    LSDB.write('cw_time_sw', new Date().getTime());
                })
            })
        }
    };
    async function updateConfig() {
        await fetch('/cw-cgi/api?type=config').then(res => res.text()).then(res => {
            if (res === 'ok') {
                console.log(`Config updated`);
                LSDB.write('cw_time_config', new Date().getTime());
            } else {
                console.log(`Config update failed`);
            }
        })
    }

    if (Number(LSDB.read('cw_time_sw')) < new Date().getTime() - updateSWDelay) {
        await updateSW();
        await updateConfig();
    }
    if (Number(LSDB.read('cw_time_config')) < new Date().getTime() - updateConfigDelay) {
        await updateConfig();
    }

    setInterval(async () => {
        await updateSW();
        await updateConfig();
    }, updateSWDelay);
    setInterval(async () => {
        await updateConfig()
    }, updateConfigDelay);
})(1000 * 60 * 60 * 12, 1000 * 60);
