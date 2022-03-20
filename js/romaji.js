let romajiStr = `
あ a	い i	う u	え e	お o
か ka	き ki	く ku	け ke	こ ko	きゃ kya	きゅ kyu	きょ kyo 
さ sa	し shi	す su	せ se	そ so	しゃ sha	しゅ shu	しょ sho
た ta	ち chi	つ tsu	て te	と to	ちゃ cha	ちゅ chu	ちょ cho
な na	に ni	ぬ nu	ね ne	の no	にゃ nya	にゅ nyu	にょ nyo 
は ha	ひ hi	ふ fu	へ he	ほ ho	ひゃ hya	ひゅ hyu	ひょ hyo 
ま ma	み mi	む mu	め me	も mo	みゃ mya	みゅ myu	みょ myo 
や ya	        ゆ yu	        よ yo	 
ら ra	り ri	る ru	れ re	ろ ro	りゃ rya	りゅ ryu	りょ ryo 
わ wa	ゐ i            ゑ e    を o    ん n
が ga	ぎ gi	ぐ gu	げ ge	ご go	ぎゃ gya	ぎゅ gyu	ぎょ gyo 
ざ za	じ ji	ず zu	ぜ ze	ぞ zo	じゃ ja	    じゅ ju 	じょ jo
だ da	ぢ ji	づ zu	で de	ど do	ぢゃ ja	    ぢゅ ju	    ぢょ jo 
ば ba	び bi	ぶ bu	べ be	ぼ bo	びゃ bya	びゅ byu	びょ byo 
ぱ pa	ぴ pi	ぷ pu	ぺ pe	ぽ po	ぴゃ pya	ぴゅ pyu	ぴょ pyo

つぁ tsa	ふぁ fa
うぃ wi		てぃ ti		ふぃ fi		でぃ di
とぅ tu		どぅ du		でゅ dyu
うぇ we		しぇ she	ちぇ che	つぇ tse	ふぇ fe		じぇ je
うぉ wo		つぉ tso	ふぉ fo
`;

let entryRegex = /(?<hira>[ぁ-ゖ]+)\s*(?<romaji>\w+)/g;

/**@type {Map<string,string>} */
let romajiMap = new Map();

while (true) {
    let match = entryRegex.exec(romajiStr);
    if (!match)
        break;
    romajiMap.set(match.groups.hira, match.groups.romaji);
}

let kataStart = 'ァ'.charCodeAt(0);
let kataEnd = 'ヶ'.charCodeAt(0);
let kataHiraDiff = kataStart - 'ぁ'.charCodeAt(0);

export function kataToHira(str) {
    let hiraCodes = [];
    for (let i = 0; i < str.length; ++i){
        let kataCode = str.charCodeAt(i);
        if (kataCode >= kataStart && kataCode <= kataEnd) {
            hiraCodes.push(kataCode - kataHiraDiff);
        }
        else {
            hiraCodes.push(kataCode);
        }
    }
    return String.fromCharCode(...hiraCodes);
}

function hasKata(str) {
    for (let i = 0; i < str.length; ++i) {
        let kataCode = str.charCodeAt(i);
        if (kataCode >= kataStart && kataCode <= kataEnd)
            return true;
    }
    return false;
}

/**@param {string} str */
export function kanaToRomaji(str) {
    if (hasKata(str))
        str = kataToHira(str);
	let moraRegex = /(?<sokuOn>っ)?(?<mora>(?![っぁぃぅぇぉゃゅょゎ])[ぁ-ゖ][ぁぃぅぇぉゃゅょゎ]?)(?<chouOn>ー)?/g;
	let results = [];

	while (true) {
		let match = moraRegex.exec(str);
		if (!match) break;
		let g = match.groups;
		let romaji = romajiMap.get(g.mora);

		if (romaji === undefined) {
			results.push('??');
			if (g.chouOn)
				results.push('-');
			continue;
		}

		let validSokuOn = g.sokuOn && /^[^あいうえお]/.test(g.mora);
		results.push(validSokuOn ? romaji[0] + romaji : romaji);

		if (g.chouOn)
			results.push(romaji.slice(-1));
	}
	return results;
}