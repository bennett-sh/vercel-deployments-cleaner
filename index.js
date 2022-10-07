const { resolve, join } = require('path')
const { launch } = require('puppeteer')

const PROJECT = 'user/project'

const sleep = async ms => new Promise(res => setTimeout(res, ms))

async function getDeployments(browser) {
  const page = await browser.newPage()

  await page.goto(`https://vercel.com/${PROJECT}/deployments`, {
    waitUntil: 'networkidle2'
  })
  
  let result = await page.evaluate(() => {
    return [...document.querySelectorAll('.deployment-list > :not(:first-child) p > a')].map(e => e.href)
  })

  await page.close()

  return result
}

async function deleteDeployment(browser, deployment) {
  const page = await browser.newPage()

  await page.goto(deployment, { waitUntil: 'networkidle2' })
  await sleep(2.5 * 1000)
  await page.evaluate(async () => {
    const sleep = async ms => new Promise(res => setTimeout(res, ms))
    
    document.querySelector('body > reach-portal:last-of-type ul > li:last-child').click()
    await sleep(1000)
    document.querySelector('body > reach-portal:last-child footer > button:last-child').click()
  })
  await sleep(2.5 * 1000)
  await page.close()
}

async function main() {
  const browser = await launch({ headless: true, userDataDir:  resolve(join(process.env.APPDATA, '..', 'Local', 'Chrome', 'User Data')) })

  let deployments = await getDeployments(browser)

  for(let i = 0; i < deployments.length; i++) {
    const deployment = deployments[i]

    try {
      console.log(`Deleting deployment... (${i+1}/${deployments.length})`)
      await deleteDeployment(browser, deployment)
    } catch(err) { console.error(`Failed to delete deployment ${i+1}/${i}: ${err}`) }
  }

  if(deployments.length < 1) console.log('No deployments found.')

  await browser.close()
}

main()