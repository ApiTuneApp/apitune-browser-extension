import { useEffect, useState } from "react"
import { Form, Input, Button, Typography, Space, Card, message } from "antd"
import "./style.css"

const { TextArea } = Input
const { Title } = Typography

const Options = () => {
  const [form] = Form.useForm()

  // Load saved settings on component mount
  useEffect(() => {
    chrome.storage.local.get(["proxyConfig", "bypassList"]).then((result) => {
      const formValues = {
        host: result.proxyConfig?.host || "127.0.0.1",
        port: result.proxyConfig?.port || "8998",
        bypassList: result.bypassList?.join("\n") || "127.0.0.1"
      }
      form.setFieldsValue(formValues)
    })
  }, [])

  const onFormSubmit = async (values) => {
    try {
      const newConfig = {
        host: values.host,
        port: values.port
      }
      
      const bypassList = values.bypassList
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "")

      // Save both proxy config and bypass list
      await chrome.storage.local.set({ 
        proxyConfig: newConfig,
        bypassList: bypassList
      })

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
              bypassList: bypassList
            }
          },
          scope: "regular"
        })
      }

      message.success("Settings saved successfully")
    } catch (error) {
      message.error("Failed to save settings")
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Title level={2}>Proxy Settings</Title>
        
        <Form
          form={form}
          onFinish={onFormSubmit}
          layout="vertical"
          initialValues={{
            host: "127.0.0.1",
            port: "8998",
            bypassList: "127.0.0.1"
          }}>
          <Card title="Proxy Configuration" style={{ marginBottom: 16 }}>
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
              Save All Settings
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </div>
  )
}

export default Options 