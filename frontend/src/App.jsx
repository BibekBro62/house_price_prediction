import { useEffect, useState } from 'react'
import styled from 'styled-components'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const initialForm = { longitude: '-122.23', latitude: '37.88', housing_median_age: '41', total_rooms: '880', total_bedrooms: '129', population: '322', households: '126', median_income: '8.3252', ocean_proximity: '<1H OCEAN' }
const fields = [
  ['longitude', 'Longitude', 'Geographic coordinate', '0.01'],
  ['latitude', 'Latitude', 'Geographic coordinate', '0.01'],
  ['housing_median_age', 'Median age', 'Years', '1'],
  ['total_rooms', 'Total rooms', 'Count of rooms', '1'],
  ['total_bedrooms', 'Total bedrooms', 'Count of bedrooms', '1'],
  ['population', 'Population', 'Residents in block', '1'],
  ['households', 'Households', 'Households in block', '1'],
  ['median_income', 'Median income', 'Ten-thousands of USD', '0.0001'],
]

function App() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new globalThis.Error('API unavailable'); return response.json() })
      .then(() => setStatus('online'))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setStatus('offline') })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const stopNumberWheel = (event) => {
      if (event.target.matches('input[type="number"]')) event.target.blur()
    }
    document.addEventListener('wheel', stopNumberWheel, { passive: true })
    return () => document.removeEventListener('wheel', stopNumberWheel)
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  const submitPrediction = async (event) => {
    event.preventDefault()
    setLoading(true); setError(''); setResult(null)
    const payload = { ...form }
    Object.keys(payload).forEach((key) => { if (key !== 'ocean_proximity') payload[key] = Number(payload[key]) })
    try {
      const response = await fetch(`${API_URL}/predict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) {
        const detail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail
        throw new globalThis.Error(detail || 'Prediction could not be completed.')
      }
      setResult(data); setStatus('online')
      requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to the prediction service.'); setStatus('offline')
    } finally { setLoading(false) }
  }

  const clearForm = () => { setForm(initialForm); setResult(null); setError('') }
  const price = result?.predicted_median_house_value || 0
  const progress = Math.min((price / 750000) * 100, 100)

  return (
    <PageShell>
      <Topbar><Brand><BrandMark>HP</BrandMark><span>House Price Prediction <Muted>/ Intelligence</Muted></span></Brand><Status><StatusDot $status={status} /> {status === 'checking' ? 'Connecting' : status === 'online' ? 'Model online' : 'Service offline'}</Status></Topbar>
      <Main>
        <Hero><Eyebrow><Pulse /> CALIFORNIA HOUSING ANALYTICS</Eyebrow><Title>Find the value<br /><Accent>between the lines.</Accent></Title><Intro>Explore an AI-generated estimate from the property details that shape a home&apos;s market story.</Intro><ModelNote><Spark>✦</Spark><span><strong>Powered by {result?.model || 'XGBoost'}</strong><br />Trained on California census housing data</span></ModelNote></Hero>
        <Workspace>
          <FormCard><CardHeading><div><SectionKicker>01 / PROPERTY PROFILE</SectionKicker><CardTitle>Tell us about the home</CardTitle></div><Required>All fields required</Required></CardHeading><Form onSubmit={submitPrediction}><FieldGrid>{fields.map(([name, label, hint, step]) => <Field key={name}><Label htmlFor={name}>{label}<Help title={hint}>?</Help></Label><Input id={name} name={name} type="number" step={step} min={name === 'longitude' ? -180 : name === 'latitude' ? -90 : 0} max={name === 'longitude' ? 180 : name === 'latitude' ? 90 : name === 'housing_median_age' ? 200 : undefined} value={form[name]} onChange={updateField} placeholder="0" required /><Hint>{hint}</Hint></Field>)}</FieldGrid><Field $wide><Label htmlFor="ocean_proximity">Ocean proximity<Help title="Nearest ocean proximity category">?</Help></Label><Select id="ocean_proximity" name="ocean_proximity" value={form.ocean_proximity} onChange={updateField}><option value="<1H OCEAN">Less than one hour ocean</option><option value="NEAR OCEAN">Near ocean</option><option value="NEAR BAY">Near bay</option><option value="INLAND">Inland</option><option value="ISLAND">Island</option></Select><Hint>Distance to the nearest coastline</Hint></Field>{error && <ApiError role="alert">{error}</ApiError>}<Actions><ClearButton type="button" onClick={clearForm}>Clear form</ClearButton><PredictButton type="submit" disabled={loading}>{loading ? 'Calculating...' : 'Generate estimate'} <Arrow>↗</Arrow></PredictButton></Actions></Form></FormCard>
          <ResultCard><ResultHeader><div><SectionKicker>02 / AI VALUATION</SectionKicker><CardTitle>Your estimate</CardTitle></div>{result && <LivePill>LIVE RESULT</LivePill>}</ResultHeader>{result ? <><GaugeWrap><GaugeRing $progress={progress}><GaugeInner><GaugeLabel>ESTIMATED VALUE</GaugeLabel><Price>${Math.round(price).toLocaleString('en-US')}</Price><GaugeCaption>median house value</GaugeCaption></GaugeInner></GaugeRing></GaugeWrap><Scale><span>$0</span><span>$750k+</span></Scale><Divider /><ResultMeta><span>Prediction engine</span><strong>{result.model}</strong></ResultMeta><ResultMeta><span>Input profile</span><strong>California housing</strong></ResultMeta></> : <EmptyState><EmptyIcon>⌁</EmptyIcon><EmptyTitle>Ready when you are</EmptyTitle><EmptyText>Complete the property profile to reveal a live valuation from the connected model.</EmptyText></EmptyState>}</ResultCard>
        </Workspace>
        <Footer><span>HOUSE PRICE INTELLIGENCE</span><span>Estimates are model outputs and not financial advice.</span><span>API <ApiUrl>{API_URL.replace(/^https?:\/\//, '')}</ApiUrl></span></Footer>
      </Main>
    </PageShell>
  )
}

const PageShell = styled.div`min-height:100vh;overflow-x:hidden;background:#f5f7f6;color:#18312c;`
const Topbar = styled.header`height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(18px,5vw,76px);border-bottom:1px solid #dfe8e3;background:rgba(255,255,255,.72);backdrop-filter:blur(14px);@media (max-width:600px){height:auto;min-height:70px;gap:14px;align-items:flex-start;padding-top:16px;padding-bottom:16px;}`
const Brand = styled.div`display:flex;align-items:center;gap:11px;font-family:Georgia,serif;font-size:19px;font-weight:bold;min-width:0;line-height:1.2;@media (max-width:600px){font-size:16px;align-items:flex-start;}`
const BrandMark = styled.span`display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#173d35;color:#d7f36b;font:700 12px Arial;`
const Muted = styled.span`color:#91a29b;font:12px Arial;letter-spacing:1px;text-transform:uppercase;@media (max-width:600px){display:none;}`
const Status = styled.div`display:flex;gap:8px;align-items:center;color:#678079;font:11px Arial;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;@media (max-width:600px){font-size:9px;letter-spacing:.7px;padding-top:4px;}`
const StatusDot = styled.span`width:7px;height:7px;border-radius:50%;background:${(p) => p.$status === 'online' ? '#89bd55' : p.$status === 'checking' ? '#d3a846' : '#c56b63'};box-shadow:0 0 0 4px #edf3e6;`
const Main = styled.main`box-sizing:border-box;width:100%;padding:clamp(44px,8vw,104px) clamp(18px,5vw,76px) 32px;`
const Hero = styled.section`max-width:610px;`
const Eyebrow = styled.div`display:flex;align-items:center;gap:9px;color:#6b897f;font:700 11px Arial;letter-spacing:1.6px;`
const Pulse = styled.span`width:7px;height:7px;border-radius:50%;background:#b5d65f;box-shadow:0 0 0 5px #e3f0c9;`
const Title = styled.h1`font:400 clamp(45px,6vw,78px)/.98 Georgia,serif;letter-spacing:-3px;margin:28px 0 22px;color:#173d35;@media (max-width:600px){letter-spacing:-1.8px;margin-top:22px;}`
const Accent = styled.span`color:#83a94f;font-style:italic;`
const Intro = styled.p`max-width:465px;margin:0;color:#70827c;font:16px/1.65 Arial;`
const ModelNote = styled.div`display:flex;align-items:center;gap:12px;margin-top:34px;color:#7c8d87;font:12px/1.55 Arial;`
const Spark = styled.span`display:grid;place-items:center;width:30px;height:30px;border:1px solid #cbdcc1;border-radius:50%;color:#87a653;`
const Workspace = styled.div`box-sizing:border-box;width:100%;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.85fr);gap:22px;margin-top:62px;align-items:stretch;@media (max-width:1200px){grid-template-columns:1fr;}`
const FormCard = styled.section`box-sizing:border-box;width:100%;min-width:0;background:#fff;border:1px solid #e1e9e5;border-radius:18px;padding:clamp(24px,4vw,42px);box-shadow:0 15px 45px rgba(34,67,56,.06);`
const ResultCard = styled.section`box-sizing:border-box;width:100%;min-width:0;background:#173d35;color:#fff;border-radius:18px;padding:clamp(24px,4vw,40px);box-shadow:0 18px 48px rgba(23,61,53,.16);min-height:430px;scroll-margin-top:24px;`
const CardHeading = styled.div`display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:29px;`
const ResultHeader = styled(CardHeading)`margin-bottom:0;`
const SectionKicker = styled.div`color:#87a653;font:700 10px Arial;letter-spacing:1.5px;margin-bottom:9px;`
const CardTitle = styled.h2`font:400 26px Georgia,serif;margin:0;color:inherit;letter-spacing:-.5px;`
const Required = styled.span`color:#a3b1ad;font:11px Arial;padding-top:4px;white-space:nowrap;`
const Form = styled.form``
const FieldGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:22px 18px;@media (max-width:520px){grid-template-columns:1fr;}`
const Field = styled.div`grid-column:${(p) => p.$wide ? '1 / -1' : 'auto'};`
const Label = styled.label`display:flex;align-items:center;gap:7px;color:#36554d;font:600 12px Arial;margin-bottom:8px;`
const Help = styled.span`display:grid;place-items:center;width:14px;height:14px;border:1px solid #b7c8c1;border-radius:50%;color:#7c948a;font:10px Georgia;cursor:help;`
const Input = styled.input`box-sizing:border-box;width:100%;height:45px;border:1px solid #dbe6e1;border-radius:8px;background:#fbfdfc;padding:0 13px;color:#18312c;font:14px Arial;outline:none;transition:all .2s;&:focus{border-color:#91b55f;box-shadow:0 0 0 3px #edf5df;background:#fff;}&::placeholder{color:#bdc9c4;}`
const Select = styled(Input).attrs({ as: 'select' })`appearance:none;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,#6f8980 50%),linear-gradient(135deg,#6f8980 50%,transparent 50%);background-position:calc(100% - 17px) 19px,calc(100% - 12px) 19px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;`
const Hint = styled.div`margin-top:6px;color:#9aa9a4;font:10px Arial;`
const Actions = styled.div`display:flex;justify-content:flex-end;align-items:center;gap:18px;margin-top:32px;padding-top:25px;border-top:1px solid #edf1ef;`
const ClearButton = styled.button`border:0;background:none;color:#8a9b95;font:12px Arial;cursor:pointer;padding:12px;&:hover{color:#31564b;}`
const PredictButton = styled.button`border:0;border-radius:8px;background:#a9cd64;color:#173d35;padding:14px 18px;font:700 12px Arial;cursor:pointer;transition:transform .2s,background .2s;&:hover{background:#b9dd73;transform:translateY(-2px);}&:disabled{opacity:.65;cursor:wait;transform:none;}`
const Arrow = styled.span`font-size:17px;margin-left:13px;vertical-align:-1px;`
const ApiError = styled.div`margin-top:20px;padding:12px 14px;border-radius:7px;background:#fff1ef;color:#b35b54;font:12px Arial;`
const LivePill = styled.span`border:1px solid #638f70;border-radius:30px;color:#b7d777;padding:6px 9px;font:700 9px Arial;letter-spacing:1px;`
const GaugeWrap = styled.div`display:grid;place-items:center;margin:42px 0 20px;`
const GaugeRing = styled.div`display:grid;place-items:center;width:232px;height:232px;border-radius:50%;background:conic-gradient(#b7d777 ${(p) => p.$progress}%,#2c574c ${(p) => p.$progress}% 100%);position:relative;&:after{content:"";position:absolute;inset:11px;border-radius:50%;background:#173d35;}`
const GaugeInner = styled.div`z-index:1;text-align:center;`
const GaugeLabel = styled.div`color:#9bb5a5;font:700 9px Arial;letter-spacing:1.5px;`
const Price = styled.div`margin-top:9px;color:#fff;font:400 clamp(31px,4vw,42px) Georgia,serif;letter-spacing:-1px;`
const GaugeCaption = styled.div`margin-top:7px;color:#88a298;font:11px Arial;`
const Scale = styled.div`display:flex;justify-content:space-between;color:#83a296;font:10px Arial;`
const Divider = styled.hr`border:0;border-top:1px solid #2b584d;margin:25px 0 18px;`
const ResultMeta = styled.div`display:flex;justify-content:space-between;padding:7px 0;color:#8da79d;font:11px Arial;& strong{color:#d2e2d8;font-weight:500;}`
const EmptyState = styled.div`display:grid;place-items:center;text-align:center;padding:90px 18px 40px;`
const EmptyIcon = styled.div`color:#9bbd61;font:38px Georgia;transform:rotate(-20deg);`
const EmptyTitle = styled.h3`font:400 23px Georgia,serif;margin:18px 0 10px;`
const EmptyText = styled.p`max-width:230px;color:#91aba0;font:12px/1.6 Arial;margin:0;`
const Footer = styled.footer`display:flex;justify-content:space-between;gap:20px;margin-top:40px;color:#a3b1ad;font:9px Arial;letter-spacing:1px;@media (max-width:650px){flex-direction:column;gap:9px;}`
const ApiUrl = styled.span`color:#7f9e91;`

export default App
