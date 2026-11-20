import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { faNumber } from '../utils/format.js'
import { ACCESS_LABELS, CALENDAR_LABELS, FILE_TYPE_LABELS, LANGUAGE_LABELS, STATUS_LABELS, label } from '../utils/labels.js'
import './resource-list.css'

export default function ResourceCard({ resource }) {
  const { id, title, authors, publication_year: year, calendar, language, category, file_type: fileType, status, access_status: access } =
    resource

  return (
    <li className="resource-card">
      <h2 className="resource-card__title" dir="auto">
        <Link to={`/resources/${id}`}>{title}</Link>
      </h2>

      <p className="resource-card__authors">
        {authors.length > 0
          ? authors.map((author, index) => (
              <Fragment key={author.id}>
                {index > 0 && '، '}
                <bdi>{author.name}</bdi>
              </Fragment>
            ))
          : 'نویسنده نامشخص'}
      </p>

      <ul className="resource-card__meta">
        <li>{year ? `${faNumber(year)} (${label(CALENDAR_LABELS, calendar)})` : 'سال نامشخص'}</li>
        {category && <li>{category.name}</li>}
        <li>{label(LANGUAGE_LABELS, language)}</li>
      </ul>

      <ul className="resource-card__badges">
        <li className="badge badge--format" dir="ltr">
          {label(FILE_TYPE_LABELS, fileType)}
        </li>
        <li className={`badge badge--access-${access}`}>{label(ACCESS_LABELS, access)}</li>
        {status !== 'published' && <li className="badge badge--status">{label(STATUS_LABELS, status)}</li>}
      </ul>
    </li>
  )
}
