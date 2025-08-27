type unsafeWindow = typeof window
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const unsafeWindow: unsafeWindow

const Win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window

let AdClickElemnts: HTMLElement[] = []
let AdClickFuncRegExps = [
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
    if (ThisArg instanceof HTMLElement && Args[0] === 'click' && typeof Args[1] === 'function' && AdClickFuncRegExps.filter(Index => Index.test(Args[1].toString())).length >= 2) {
      AdClickElemnts.push(ThisArg)
    }
    return Reflect.apply(Target, ThisArg, Args)
  }
})

setInterval(() => {
  if (location.href.startsWith('https://namu.wiki/w/')) {
    let AdContainers = Array.from(document.querySelectorAll('div[class*=" "] div[class]')).filter(AdContainer => AdContainer instanceof HTMLElement)

    AdContainers = AdContainers.filter((AdContainer) => {
      let AdContainerPaddingLeft = Number(getComputedStyle(AdContainer).getPropertyValue('padding-left').replaceAll('px', ''))
      let AdContainerPaddingRight = Number(getComputedStyle(AdContainer).getPropertyValue('padding-right').replaceAll('px', ''))
      let AdContainerPaddingTop = Number(getComputedStyle(AdContainer).getPropertyValue('padding-top').replaceAll('px', ''))
      let AdContainerPaddingBottom = Number(getComputedStyle(AdContainer).getPropertyValue('padding-bottom').replaceAll('px', ''))
      return AdContainerPaddingLeft > 5 && AdContainerPaddingRight > 5 && AdContainerPaddingTop > 5 && AdContainerPaddingBottom > 5
    })
    AdContainers = AdContainers.filter(AdContainer => AdClickElemnts.some(AdClickElemnt => AdContainer.contains(AdClickElemnt)))

    AdContainers = AdContainers.filter(AdContainer => GetParents(AdContainer).some(Parent => Number(getComputedStyle(Parent).getPropertyValue('margin-top').replaceAll('px', '')) > 10 ))

    AdContainers = AdContainers.filter(AdContainer => AdContainer.innerText.length < 1000)

    AdContainers = AdContainers.filter(AdContainer => Array.from(AdContainer.querySelectorAll('*[href="/RecentChanges"]')).filter(Ele => Ele instanceof HTMLElement && getComputedStyle(Ele).getPropertyValue('display') !== 'none').length === 0)

    AdContainers = AdContainers.filter(AdContainer => !AdContainer.innerText.includes((new URL(location.href).searchParams.get('from') || '') + '에서 넘어옴'))

    AdContainers = AdContainers.filter(AdContainer => !/\[[0-9]+\] .+/.test(AdContainer.innerText))

    AdContainers.forEach(Ele => Ele.remove())

    let AdPlaceholders = Array.from(document.querySelectorAll('div[class]'))
      .filter((Ele): Ele is HTMLElement => Ele instanceof HTMLElement)
      .filter(Ele => /^w[0-9a-zA-Z]{7}$/.test(Ele.className))
      .filter(Ele => Ele.innerText.trim().length === 0)
      .filter(Ele => Ele.childElementCount > 0)

    AdPlaceholders.forEach(Ele => Ele.remove())
  }
}, 1000)

let PowerLinkGenerationPositiveRegExps: RegExp[][] = [[
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
    let StringifiedFunc = ThisArg.toString()
    if (PowerLinkGenerationPositiveRegExps.filter(PowerLinkGenerationPositiveRegExp => PowerLinkGenerationPositiveRegExp.filter(Index => Index.test(StringifiedFunc)).length >= 3).length === 1) {
      console.debug('[NamuLink] Function.prototype.bind:', ThisArg)
      return Reflect.apply(Target, () => {}, [])
    }
    return Reflect.apply(Target, ThisArg, Args)
  }
})
