import { useEffect } from "react"
import { Form, Input, Button, Typography, Space, Card } from "antd"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

const { TextArea } = Input
const { Title } = Typography

const Options = () => {
  const [proxyConfig, setProxyConfig] = useStorage("proxyConfig", {
    host: "127.0.0.1",
    port: "8998"
  })
  const [bypassList, setBypassList] = useStorage("bypassList", [
    "localhost",
    "127.0.0.1"
  ])

  const onProxyConfigSubmit = (values) => {
    setProxyConfig({
      host: values.host,
      port: values.port
    })
  }

  const onBypassListChange = (e) => {
    const lines = e.target.value.split("\n").filter(line => line.trim() !== "")
    setBypassList(lines)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Title level={2}>Proxy Settings</Title>
        
        <Card title="Proxy Configuration">
          <Form
            initialValues={proxyConfig}
            onFinish={onProxyConfigSubmit}
            layout="vertical">
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

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save Proxy Configuration
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Proxy Bypass List">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Text>
              Enter one URL pattern per line. The proxy will not be used for addresses that match these patterns.
            </Typography.Text>
            <TextArea
              rows={10}
              value={bypassList.join("\n")}
              onChange={onBypassListChange}
              placeholder="Enter URL patterns to bypass proxy&#10;Example:&#10;localhost&#10;127.0.0.1&#10;*.example.com"
            />
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default Options 