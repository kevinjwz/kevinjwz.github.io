# 练习：拗音 促音

双击可以查看答案。

### 拗音
'''
|-------------|------|-----|
[おちゃ]{0}     |御茶    |'茶'
[ひゃく]{2}     |百    |'一百'
[きょう]{1}     |今日    |''
[きょか]{1}     |許可    |''
[じゅう]{1}     |十    |''
[きゃく]{0}     |客    |'客人；顾客'
[じしょ]{1}     |辞書    |''
[りょこう]{0}     |旅行    |''
[ちょうど]{0}     |丁度    |'正好'
[しんじゃ]{1}     |信者    |'信徒'
[びみょう]{0}     |微妙    |''
[じゅんび]{1}     |準備    |'准备'
[じょしゅ]{0}     |助手    |''
[きゅうけい]{0}     |休憩    |'休息'
[びょういん]{0}     |病院    |'医院'
[ちゅうがく]{1}     |中学    |''
[りょうかい]{0}     |了解    |''
[しょうじょ]{1}     |少女    |''
[じんみゃく]{0}     |人脈    |'人脉'
[しゅじゅつ]{1}     |手術    |''
[せいしゅん]{0}     |青春    |''
[ちょくせつ]{0}     |直接    |''
[ぎゅうにゅう]{0}     |牛乳    |'牛奶'
[ひょうりゅう]{0}     |漂流    |''
'''

### 促音
'''
|-------------|------|-----|
[みっか]{0}     |三日    |'三天'
[こっち]{0}     |此方    |'这边'
[まっか]{3}     |真っ赤    |'通红'
[ざっし]{0}     |雑誌    |''
[はっぱ]{0}     |葉っぱ    |'叶子'
[じっけん]{0}     |実験    |''
[ちょっと]{1}     |一寸    |'稍微'
[やっぱり]{3}     |矢っ張り    |'果然'
[しっかり]{3}     |確り    |'切实地'
[まっすぐ]{3}     |真っ直ぐ    |'笔直'
[まっしろ]{3}     |真っ白    |'雪白'
[じっさい]{0}     |実際    |'事实上'
[いったい]{0}     |一体    |'到底'
[がっこう]{0}     |学校    |''
[ひっこす]{3}     |引っ越す    |'搬家'
[いっしょ]{0}     |一緒    |'一起'
[しっぱい]{0}     |失敗    |''
[まったく]{3}     |全く    |'完全'
[しゅっぱつ]{0}     |出発    |'出发'
[しゃっきん]{3}     |借金    |'借款'
[おっしゃる]{3}     |仰る    |'（敬语）说'
[きっさてん]{3}     |喫茶店    |'咖啡馆'
[いっしょう]{0}     |一生    |''
[しゅっちょう]{0}     |出張    |'出差'
[いらっしゃい]{4}     |    |'欢迎光临'
'''

<style>
div.peek-answer {
    position: absolute;
    width: max-content;
    bottom: calc(100% - 0.5em);
    left: 0;
    right: 0;
    margin: 0 auto;
    background-color: var(--bg-green);
    border: solid 1px var(--green);
    padding: 0.3em 0.5em;
}
td:first-child {
    position: relative;
    cursor: pointer;
}
table {
    overflow: visible;
}
</style>

<script type="module">
function addClickHandler(){
    let tables = document.getElementsByTagName('table');
    for(let table of tables){
        for(let tr of table.rows){
            tr.cells[0].addEventListener('dblclick', _onClick);
        }
    }
}

import {kanaToRomaji} from '/js/romaji.js';

function _onClick(){
    let td = this;
    let answer = document.createElement('div');
    answer.classList.add('peek-answer');
    answer.textContent = kanaToRomaji(td.innerText).join(' ');
    td.append(answer);
    setTimeout(()=>answer.remove(), 3000);
}

addClickHandler();

</script>