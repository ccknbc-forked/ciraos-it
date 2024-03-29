/*
 * ********* main.js ********** *
 */

/*
 * scroll-down
 */

/* $('#scroll-down').click(
    function () {
        $('html,body').animate({
            scrollTop: document.getElementById('scroll-down')[0].scrollHeight
        }, 2000); return false;
    }
); */

/*
 * sw-racing
 */
(async () => {//使用匿名函数确保body已载入
    /*
    QYBlogHelper_Set 存储在LocalStorage中,用于指示sw安装状态
    0 或不存在 未安装
    1 已打断
    2 已安装
    3 已激活,并且已缓存必要的文件(此处未写出,无需理会)
    */
    if ('serviceWorker' in navigator) { //如果支持sw
        if (Number(window.localStorage.getItem('CiraosBlogHelper_Set')) < 1) {
            setTimeout(async () => {
                console.log('检测到您的浏览器没有安装CiraosBlogHelper_Set，开始注册')
                window.stop()
                window.localStorage.setItem('CiraosBlogHelper_Set', 1)
                const replacehtml = await fetch('https://npm.elemecdn.com/chenyfan-blog@1.0.13/public/notice.html')
                document.body.innerHTML = await replacehtml.text()
                $('#info').innerText = '尝试安装CiraosBlogHelper...';
            }, 0);
        }
        const $ = document.querySelector.bind(document);//语法糖
        navigator.serviceWorker.register(`/cw.js?time=${new Date().getTime()}`)//随机数,强制更新
            .then(async () => {
                if (Number(window.localStorage.getItem('CiraosBlogHelper_Set')) < 2) {
                    setTimeout(() => {
                        $('#info').innerText = '安装成功,稍等片刻...';
                    }, 0);
                    setTimeout(() => {
                        window.localStorage.setItem('CiraosBlogHelper_Set', 2)
                        console.log('准备跳转')
                        window.location.reload()//刷新,以载入sw
                    }, 500)//安装后等待500ms使其激活
                }
            })
            .catch(err => console.error(`CiraosBlogHelper_Set:${err}`))
    } else {
        setTimeout(() => {
            $('#info').innerText = '很抱歉,我们已不再支持您的浏览器.';
        }, 0);
    }
})()

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
 * ***** * auto-update.cw * ***** *
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