import Logo from "data-base64:~assets/logo.svg"

import { useEffect, useState } from "react"
import { Button, Space, Typography, Switch, Card, Divider, Select, Tooltip } from "antd"
import { SettingOutlined } from "@ant-design/icons"
import "./style.css"

const { Text, Title } = Typography
const { Option } = Select

const Popup = () => {
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [currentProfileId, setCurrentProfileId] = useState("")
  const [currentProfile, setCurrentProfile] = useState({
    name: "Default",
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

  const onProfileChange = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      setCurrentProfile(profile)
      setCurrentProfileId(profileId)
      await chrome.storage.local.set({ currentProfileId: profileId })

      // Update proxy settings if enabled
      if (proxyEnabled) {
        await chrome.proxy.settings.set({
          value: {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                scheme: "http",
                host: profile.host,
                port: parseInt(profile.port)
              },
              bypassList: profile.bypassList
            }
          },
          scope: "regular"
        })
      }
    }
  }

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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src={Logo} alt="ApiTune Logo" style={{ width: 20, height: 20 }} />
              <Title 
                level={5} 
                style={{ 
                  margin: 0,
                  fontWeight: 600
                }}
              >
                ApiTune Proxy
              </Title>
            </div>
            <Tooltip 
              title={proxyEnabled ? 
                "Click to disable proxy server" : 
                "Enable proxy server to route traffic through selected profile"
              }
              placement="bottom"
            >
              <Switch
                checked={proxyEnabled}
                onChange={toggleProxy}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </Tooltip>
          </div>
          
          <Divider style={{ margin: "8px 0" }} />
          
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            <Select
              style={{ width: "100%" }}
              value={currentProfileId}
              onChange={onProfileChange}
              options={profiles.map(profile => ({
                label: profile.name,
                value: profile.id
              }))}
            />
            
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
        </Space>
      </Card>
    </div>
  )
}

export default Popup
