// Preserve the original layout and browser-saved National Day itinerary as a read-only page.
document.querySelectorAll('input, select').forEach(control => { control.disabled = true; });
document.querySelectorAll('button:not(#export-pdf)').forEach(control => { control.hidden = true; });
document.querySelector('.editor-toolbar').insertAdjacentHTML('afterbegin', '<span>国庆原版存档 · 只读</span><a href="./index.html" style="color:white;margin-right:auto">返回旅行计划器 ↗</a>');
document.querySelectorAll('.route-edit, .editable-name:after').forEach(control => { control.style.display = 'none'; });
document.addEventListener('change', event => { event.stopImmediatePropagation(); }, true);
document.addEventListener('input', event => { event.stopImmediatePropagation(); }, true);
