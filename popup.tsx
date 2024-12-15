import { useEffect, useState } from "react"
import { Button, Space, Typography, Switch, Card, Divider } from "antd"
import { SettingOutlined } from "@ant-design/icons"
import "./style.css"

const { Text, Title } = Typography

const Popup = () => {
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [currentProfileId, setCurrentProfileId] = useState("")
  const [currentProfile, setCurrentProfile] = useState({
    host: "127.0.0.1",
    port: "8998",
    bypassList: ["127.0.0.1"]
  })

  // Load saved settings on component mount
  useEffect(() => {
    chrome.storage.local.get(["proxyEnabled", "proxyProfiles", "currentProfileId"]).then((result) => {
      if (result.proxyEnabled !== undefined) {
        setProxyEnabled(result.proxyEnabled)
      }
      if (result.proxyProfiles) {
        setProfiles(result.proxyProfiles)
        
        const profileId = result.currentProfileId || result.proxyProfiles[0]?.id
        setCurrentProfileId(profileId)
        
        const profile = result.proxyProfiles.find(p => p.id === profileId)
        if (profile) {
          setCurrentProfile(profile)
        }
      }
    })
  }, [])

  const toggleProxy = async () => {
    const newState = !proxyEnabled
    
    if (newState) {
      await chrome.proxy.settings.set({
        value: {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: "http",
              host: currentProfile.host,
              port: parseInt(currentProfile.port)
            },
            bypassList: currentProfile.bypassList
          }
        },
        scope: "regular"
      })
    } else {
      await chrome.proxy.settings.set({
        value: {
          mode: "direct"
        },
        scope: "regular"
      })
    }
    
    await chrome.storage.local.set({ proxyEnabled: newState })
    setProxyEnabled(newState)
  }

  return (
    <div style={{ padding: 12, width: 280 }}>
      <Card 
        bordered={false} 
        styles={{ body: { padding: "12px" } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>ApiTune Proxy Switch</Title>
            <Switch
              checked={proxyEnabled}
              onChange={toggleProxy}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>
          
          <Divider style={{ margin: "8px 0" }} />
          
          <div style={{ 
            padding: "8px 12px",
            background: "#f5f5f5",
            borderRadius: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Text style={{ fontSize: "13px" }}>
              {currentProfile.host}:{currentProfile.port}
            </Text>
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => {
                chrome.runtime.openOptionsPage()
              }}
            />
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Popup
