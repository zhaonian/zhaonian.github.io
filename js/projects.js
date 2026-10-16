/* Projects page interactions: scroll reveal, 3D tilt, platform filter, rating count-up. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));

    /* ---------- Scroll reveal ---------- */
    var revealTargets = document.querySelectorAll('.reveal, .project-card');

    function countUp(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        if (isNaN(target) || reduceMotion) return;
        var start = null;
        var duration = 1100;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(1);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        // Guarantee the final value even if rAF is throttled (background tab etc).
        setTimeout(function () { el.textContent = target.toFixed(1); }, duration + 100);
    }

    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            var batch = 0;
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                el.style.setProperty('--delay', (batch++ * 90) + 'ms');
                el.classList.add('is-visible');
                var rating = el.querySelector('[data-count]');
                if (rating) setTimeout(function () { countUp(rating); }, 300);
                io.unobserve(el);
                // Clear the stagger delay once revealed so hover/tilt stay snappy.
                setTimeout(function () { el.style.removeProperty('--delay'); }, 1200);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealTargets.forEach(function (el) { io.observe(el); });
    } else {
        revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- 3D tilt + glare ---------- */
    if (finePointer && !reduceMotion) {
        cards.forEach(function (card) {
            var max = card.classList.contains('project-card--featured') ? 3 : 7;
            var frame = null;

            card.addEventListener('pointermove', function (e) {
                if (frame) cancelAnimationFrame(frame);
                frame = requestAnimationFrame(function () {
                    var r = card.getBoundingClientRect();
                    var x = (e.clientX - r.left) / r.width;
                    var y = (e.clientY - r.top) / r.height;
                    card.classList.add('is-tilting');
                    card.style.setProperty('--ry', ((x - 0.5) * 2 * max).toFixed(2) + 'deg');
                    card.style.setProperty('--rx', ((0.5 - y) * 2 * max).toFixed(2) + 'deg');
                    card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                    card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
                });
            });

            card.addEventListener('pointerleave', function () {
                if (frame) cancelAnimationFrame(frame);
                card.classList.remove('is-tilting');
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* ---------- Platform filter ---------- */
    var filterBar = document.querySelector('.filters');
    var pill = filterBar && filterBar.querySelector('.filters-pill');
    var buttons = filterBar ? Array.prototype.slice.call(filterBar.querySelectorAll('.filter')) : [];
    var emptyState = document.querySelector('.empty-state');

    function movePill(btn) {
        if (!pill || !btn) return;
        pill.style.width = btn.offsetWidth + 'px';
        pill.style.height = btn.offsetHeight + 'px';
        pill.style.transform = 'translate(' + btn.offsetLeft + 'px,' + btn.offsetTop + 'px)';
    }

    function applyFilter(filter) {
        var shown = 0;
        cards.forEach(function (card) {
            var platforms = (card.getAttribute('data-platforms') || '').split(/\s+/);
            var match = filter === 'all' || platforms.indexOf(filter) !== -1;
            card.classList.remove('is-entering');
            if (match) {
                card.classList.remove('is-hidden');
                card.classList.add('is-visible');
                if (!reduceMotion) {
                    card.style.setProperty('--delay', (shown * 60) + 'ms');
                    void card.offsetWidth; // restart animation
                    card.classList.add('is-entering');
                }
                shown++;
            } else {
                card.classList.add('is-hidden');
            }
        });
        if (emptyState) emptyState.hidden = shown !== 0;
    }

    cards.forEach(function (card) {
        card.addEventListener('animationend', function (e) {
            if (e.animationName === 'popIn') {
                card.classList.remove('is-entering');
                card.style.removeProperty('--delay');
            }
        });
    });

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            buttons.forEach(function (b) {
                b.classList.toggle('is-active', b === btn);
                b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
            });
            movePill(btn);
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

    function syncPill() { movePill(filterBar && filterBar.querySelector('.filter.is-active')); }
    window.addEventListener('resize', syncPill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncPill);
    syncPill();
})();
