type unsafeWindow = typeof window
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const unsafeWindow: unsafeWindow

const Win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

const AdClickElemnts: HTMLElement[] = []
const AdClickFuncRegExps = [
  /=> *{ *if *\( *[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+ *\) *\{ *if *\( *[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+ *<=/,
  /\.map\( *\( *[a-zA-Z0-9_]+ *=> *[a-zA-Z0-9_]+ *=> *! *[a-zA-Z0-9_]+\._stopped *&&/
]

function GetParents(Ele: HTMLElement) {
  let Parents: HTMLElement[] = []
  while (Ele.parentElement) {
    Parents.push(Ele.parentElement)
    Ele = Ele.parentElement
  }
  return Parents
}

Win.EventTarget.prototype.addEventListener = new Proxy(Win.EventTarget.prototype.addEventListener, {
  apply(Target: typeof EventTarget.prototype.addEventListener, ThisArg: EventTarget, Args: Parameters<typeof EventTarget.prototype.addEventListener>) {
    if (ThisArg instanceof HTMLElement && Args[0] === 'click' && typeof Args[1] === 'function') {
      let MatchCount = 0
      const Stringified = Args[1].toString()
      for (const RegExp of AdClickFuncRegExps) {
        if (RegExp.test(Stringified) && ++MatchCount >= 2) {
          AdClickElemnts.push(ThisArg)
          break
        }
      }
    }
    return Reflect.apply(Target, ThisArg, Args)
  }
})

setInterval(() => {
  if (location.href.startsWith('https://namu.wiki/w/')) {
    const FromParam = (new URL(location.href).searchParams.get('from') || '') + '에서 넘어옴'
    const AdContainers: HTMLElement[] = []
    for (const Node of document.querySelectorAll('div[class*=" "] div[class]')) {
      const AdContainer = Node as HTMLElement
      const Style = getComputedStyle(AdContainer)
      if (
        parseFloat(Style.paddingLeft) <= 5 ||
        parseFloat(Style.paddingRight) <= 5 ||
        parseFloat(Style.paddingTop) <= 5 ||
        parseFloat(Style.paddingBottom) <= 5
      ) continue
      if (!AdClickElemnts.some(AdClickElemnt => AdContainer.contains(AdClickElemnt))) continue
      let Margin = false
      for (const Parent of GetParents(AdContainer)) {
        if (parseFloat(getComputedStyle(Parent).marginTop) > 10) {
          Margin = true
          break
        }
      }
      if (!Margin) continue
      if (AdContainer.innerText.length >= 1000) continue
      let RecentChanges = false
      for (const Ele of AdContainer.querySelectorAll('*[href="/RecentChanges"]')) {
        if (Ele instanceof HTMLElement && getComputedStyle(Ele).display !== 'none') {
          RecentChanges = true
          break
        }
      }
      if (RecentChanges) continue
      if (AdContainer.innerText.includes(FromParam)) continue
      if (/\[[0-9]+\] .+/.test(AdContainer.innerText)) continue
      AdContainers.push(AdContainer)
    }
    AdContainers.forEach(Ele => Ele.remove())

    const AdPlaceholders: HTMLElement[] = []
    for (const Node of document.querySelectorAll('div[class]')) {
      const Ele = Node as HTMLElement
      if (!/^w[0-9a-zA-Z]{7}$/.test(Ele.className)) continue
      if (Ele.innerText.trim().length !== 0) continue
      if (Ele.childElementCount <= 0) continue
      AdPlaceholders.push(Ele)
    }
    AdPlaceholders.forEach(Ele => Ele.remove())
  }
}, 1000)

const PowerLinkGenerationPositiveRegExps: RegExp[][] = [[
  /for *\( *; *; *\) *switch *\( *_[a-z0-9]+\[_[a-z0-9]+\([a-z0-9]+\)\] *=_[a-z0-9]+/,
  /_[a-z0-9]+\[('|")[A-Z]+('|")\]\)\(\[ *\]\)/,
  /0x[a-z0-9]+ *\) *; *case/
], [
  /; *return *this\[_0x[a-z0-9]+\( *0x[0-9a-z]+ *\)/,
  /; *if *\( *_0x[a-z0-9]+ *&& *\( *_0x[a-z0-9]+ *= *_0x[a-z0-9]+/,
  /\) *, *void *\( *this *\[ *_0x[a-z0-9]+\( *0x[0-9a-z]+ *\) *\] *= *_0x[a-z0-9]+ *\[/
]]

Win.Function.prototype.bind = new Proxy(Win.Function.prototype.bind, {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  apply(Target: typeof Function.prototype.bind, ThisArg: Function, Args: Parameters<typeof Function.prototype.bind>) {
    const StringifiedFunc = ThisArg.toString()
    let GroupMatch = 0
    outer: for (const Group of PowerLinkGenerationPositiveRegExps) {
      let Count = 0
      for (const RegExp of Group) {
        if (RegExp.test(StringifiedFunc) && ++Count >= 3) {
          if (++GroupMatch > 1) break outer
          break
        }
      }
    }
    if (GroupMatch === 1) {
      console.debug('[NamuLink] Function.prototype.bind:', ThisArg)
      return Reflect.apply(Target, () => {}, [])
    }
    return Reflect.apply(Target, ThisArg, Args)
  }
})
