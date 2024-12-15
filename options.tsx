import { useEffect, useState } from "react"
import { Form, Input, Button, Typography, Space, Card, message, Select, Popconfirm } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import "./style.css"

const { TextArea } = Input
const { Title } = Typography
const { Option } = Select

interface ProxyProfile {
  id: string
  name: string
  host: string
  port: string
  bypassList: string[]
}

const Options = () => {
  const [form] = Form.useForm()
  const [profiles, setProfiles] = useState<ProxyProfile[]>([])
  const [currentProfileId, setCurrentProfileId] = useState<string>("")

  // Load saved profiles on component mount
  useEffect(() => {
    chrome.storage.local.get(["proxyProfiles", "currentProfileId"]).then((result) => {
      if (!result.proxyProfiles || result.proxyProfiles.length === 0) {
        // Initialize with default profile
        const defaultProfile: ProxyProfile = {
          id: "default",
          name: "Default",
          host: "127.0.0.1",
          port: "8998",
          bypassList: ["127.0.0.1"]
        }
        setProfiles([defaultProfile])
        setCurrentProfileId("default")
        chrome.storage.local.set({ 
          proxyProfiles: [defaultProfile],
          currentProfileId: "default"
        })
      } else {
        setProfiles(result.proxyProfiles)
        setCurrentProfileId(result.currentProfileId || result.proxyProfiles[0].id)
      }
    })
  }, [])

  // Update form when profile changes
  useEffect(() => {
    const currentProfile = profiles.find(p => p.id === currentProfileId)
    if (currentProfile) {
      form.setFieldsValue({
        name: currentProfile.name,
        host: currentProfile.host,
        port: currentProfile.port,
        bypassList: currentProfile.bypassList.join("\n")
      })
    }
  }, [currentProfileId, profiles])

  const onProfileChange = (profileId: string) => {
    setCurrentProfileId(profileId)
    chrome.storage.local.set({ currentProfileId: profileId })
  }

  const addNewProfile = () => {
    const newProfile: ProxyProfile = {
      id: Date.now().toString(),
      name: "New Profile",
      host: "127.0.0.1",
      port: "8998",
      bypassList: ["127.0.0.1"]
    }
    const newProfiles = [...profiles, newProfile]
    setProfiles(newProfiles)
    setCurrentProfileId(newProfile.id)
    chrome.storage.local.set({ 
      proxyProfiles: newProfiles,
      currentProfileId: newProfile.id
    })
  }

  const deleteProfile = async (profileId: string) => {
    if (profiles.length === 1) {
      message.error("Cannot delete the last profile")
      return
    }

    const newProfiles = profiles.filter(p => p.id !== profileId)
    setProfiles(newProfiles)
    
    if (currentProfileId === profileId) {
      setCurrentProfileId(newProfiles[0].id)
      chrome.storage.local.set({ currentProfileId: newProfiles[0].id })
    }
    
    chrome.storage.local.set({ proxyProfiles: newProfiles })
    message.success("Profile deleted")
  }

  const onFormSubmit = async (values) => {
    try {
      const bypassList = values.bypassList
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "")

      // Update current profile
      const newProfiles = profiles.map(profile => {
        if (profile.id === currentProfileId) {
          return {
            ...profile,
            name: values.name,
            host: values.host,
            port: values.port,
            bypassList
          }
        }
        return profile
      })

      await chrome.storage.local.set({ proxyProfiles: newProfiles })
      setProfiles(newProfiles)

      // Update Chrome proxy settings if enabled
      const { proxyEnabled } = await chrome.storage.local.get("proxyEnabled")
      if (proxyEnabled) {
        await chrome.proxy.settings.set({
          value: {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                scheme: "http",
                host: values.host,
                port: parseInt(values.port)
              },
              bypassList
            }
          },
          scope: "regular"
        })
      }

      message.success("Profile saved successfully")
    } catch (error) {
      message.error("Failed to save profile")
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Proxy Settings</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={addNewProfile}
          >
            New Profile
          </Button>
        </div>

        <Form
          form={form}
          onFinish={onFormSubmit}
          layout="vertical">
          
          <Card title="Profile Configuration" style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', marginBottom: 16 }} align="start">
              <Select
                style={{ width: 200 }}
                value={currentProfileId}
                onChange={onProfileChange}
              >
                {profiles.map(profile => (
                  <Option key={profile.id} value={profile.id}>{profile.name}</Option>
                ))}
              </Select>
              <Popconfirm
                title="Delete this profile?"
                description="Are you sure to delete this profile?"
                onConfirm={() => deleteProfile(currentProfileId)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  disabled={profiles.length === 1}
                >
                  Delete Profile
                </Button>
              </Popconfirm>
            </Space>

            <Form.Item
              label="Profile Name"
              name="name"
              rules={[{ required: true, message: "Please input profile name!" }]}>
              <Input placeholder="Profile Name" />
            </Form.Item>

            <Form.Item
              label="Proxy Host"
              name="host"
              rules={[{ required: true, message: "Please input proxy host!" }]}>
              <Input placeholder="127.0.0.1" />
            </Form.Item>

            <Form.Item
              label="Proxy Port"
              name="port"
              rules={[{ required: true, message: "Please input proxy port!" }]}>
              <Input placeholder="8998" />
            </Form.Item>
          </Card>

          <Card title="Proxy Bypass List" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text>
                Enter one URL pattern per line. The proxy will not be used for addresses that match these patterns.
                <br />
                <a 
                  href="https://developer.chrome.com/extensions/proxy#bypass_list"
                  target="_blank"
                >
                  Learn more about bypass patterns
                </a>
              </Typography.Text>
              <Form.Item
                name="bypassList"
                rules={[{ required: true, message: "Please input bypass list!" }]}>
                <TextArea
                  placeholder="Example:
localhost
127.0.0.1
*.example.com"
                  style={{ fontFamily: "monospace" }}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </Form.Item>
            </Space>
          </Card>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large">
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </div>
  )
}

export default Options 