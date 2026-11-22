import { Fragment, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ResourceActions from '../components/ResourceActions.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { useAuth } from '../context/useAuth.js'
import useResource from '../hooks/useResource.js'
import { faNumber, formatDate, formatFileSize } from '../utils/format.js'
import { ACCESS_LABELS, CALENDAR_LABELS, FILE_TYPE_LABELS, LANGUAGE_LABELS, STATUS_LABELS, label } from '../utils/labels.js'
import '../components/forms.css'
import '../components/resource-detail.css'
import '../components/resource-list.css'

const ACTION_NOTICE = 'این عملیات بعد از آماده‌شدن API فایل فعال می‌شود.'

function Skeleton() {
  return (
    <div>
      <p role="status" className="visually-hidden">
        در حال بارگذاری جزئیات…
      </p>
      <div aria-hidden="true" className="detail__skeleton">
        <span className="skeleton skeleton--title" />
        <span className="skeleton skeleton--line" />
        <span className="skeleton skeleton--tags" />
        <span className="skeleton skeleton--line" />
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry, isAuthenticated, backLink }) {
  // 403 و 404 عمداً یک پیام دارند تا وجود منبع محرمانه فاش نشود (ACL-12)
  if (error.status === 403 || error.status === 404) {
    return (
      <StateMessage
        title="منبع پیدا نشد"
        action={isAuthenticated ? backLink : <Link to="/login">برای ادامه وارد شوید</Link>}
      >
        این منبع وجود ندارد یا برای شما قابل نمایش نیست.
      </StateMessage>
    )
  }

  const offline = error.code === 'network_error'
  return (
    <StateMessage
      tone="error"
      title={offline ? 'ارتباط با سرور برقرار نشد' : 'مشکلی در سرور پیش آمد'}
      action={
        <button type="button" className="btn-submit btn-submit--inline" onClick={onRetry}>
          تلاش دوباره
        </button>
      }
    >
      {offline ? 'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.' : 'مشکل از شما نیست. کمی بعد دوباره تلاش کنید.'}
    </StateMessage>
  )
}

export default function ResourceDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { status, data: resource, error, reload } = useResource(id)
  const [notice, setNotice] = useState('')

  // «بازگشت» به همان فهرست با همان جست‌وجو، صفحه و فیلترها
  const backLink = (
    <Link to={{ pathname: '/', search: location.state?.listSearch || '' }} className="detail__back">
      بازگشت به فهرست منابع
    </Link>
  )

  let content
  if (status === 'loading') {
    content = <Skeleton />
  } else if (status === 'error') {
    content = <ErrorState error={error} onRetry={reload} isAuthenticated={isAuthenticated} backLink={backLink} />
  } else {
    const {
      title, authors, publisher, publication_year: year, calendar, language, categories,
      keywords, description, isbn, status: resourceStatus, access_status: access,
      permissions, files, created_at: createdAt,
    } = resource

    const meta = [
      ['ناشر', publisher],
      ['سال انتشار', year ? `${faNumber(year)} (${label(CALENDAR_LABELS, calendar)})` : 'نامشخص'],
      ['زبان', label(LANGUAGE_LABELS, language)],
      ['دسته‌بندی', categories.map((category) => category.name).join('، ')],
      ['شابک (ISBN)', isbn],
      ['کلیدواژه‌ها', keywords],
      ['تاریخ ثبت', formatDate(createdAt)],
    ].filter(([, value]) => value)

    content = (
      <>
        <header className="detail__header">
          <h1 dir="auto">{title}</h1>
          <p className="detail__authors">
            {authors.length > 0
              ? authors.map((author, index) => (
                  <Fragment key={author.id}>
                    {index > 0 && '، '}
                    <bdi>{author.name}</bdi>
                  </Fragment>
                ))
              : 'نویسنده نامشخص'}
          </p>
          <ul className="resource-card__badges">
            <li className={`badge badge--access-${access}`}>{label(ACCESS_LABELS, access)}</li>
            {resourceStatus !== 'published' && <li className="badge badge--status">{label(STATUS_LABELS, resourceStatus)}</li>}
          </ul>
        </header>

        <ResourceActions
          permissions={permissions}
          accessStatus={access}
          isAuthenticated={isAuthenticated}
          onAction={() => setNotice(ACTION_NOTICE)}
        />
        {notice && (
          <p className="detail__notice" role="status">
            {notice}
          </p>
        )}

        <dl className="detail__meta">
          {meta.map(([term, value]) => (
            <Fragment key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>

        {description && (
          <section>
            <h2 className="detail__heading">توضیحات</h2>
            <p className="detail__description">{description}</p>
          </section>
        )}

        <section>
          <h2 className="detail__heading">فایل‌ها</h2>
          {files.length === 0 ? (
            <p className="detail__empty">برای این منبع فایلی ثبت نشده است.</p>
          ) : (
            <ul className="files">
              {files.map((file) => (
                <li key={file.id} className="files__item">
                  <bdi className="files__name" dir="ltr">
                    {file.original_name}
                  </bdi>
                  <span className="badge badge--format" dir="ltr">
                    {label(FILE_TYPE_LABELS, file.file_type)}
                  </span>
                  <span>{formatFileSize(file.size)}</span>
                  {file.processing_status !== 'ready' && <span className="badge badge--status">{file.processing_status}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    )
  }

  return (
    <article aria-busy={status === 'loading'}>
      {status !== 'error' && backLink}
      {content}
    </article>
  )
}
