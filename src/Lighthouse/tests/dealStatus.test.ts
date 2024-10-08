import lighthouse from '..'

describe('dealStatus', () => {
  it('should retrieve deal status when valid CID provided', async () => {
    const response = (
      await lighthouse.dealStatus(
        'QmaiauHSgTDMy2NtLbsygL3iKmLXBqHf39SBA1nAQFSSey'
      )
    ).data

    expect(response[0]).toHaveProperty('dealStatus')
    expect(response[0]).toHaveProperty('dealUUID')
    expect(response[0]).toHaveProperty('dealId')
    expect(response[0]).toHaveProperty('miner')
  }, 20000)

  it('should not retrieve deal status when invalid CID provided', async () => {
    try {
      const response = await lighthouse.dealStatus('')
    } catch (error: any) {
      expect(error.message).toBe('Request failed with status code 400')
    }
  }, 20000)
})
