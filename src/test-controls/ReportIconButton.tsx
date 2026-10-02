import {forwardRef} from 'react';
import type {ButtonHTMLAttributes} from 'react';
import './report-icon-button.css';
export const ReportIconButton=forwardRef<HTMLButtonElement,ButtonHTMLAttributes<HTMLButtonElement>&{icon:'more'|'skills-activity';label:string}>(function ReportIconButton({icon,label,className='',...props},ref){return <button {...props} ref={ref} type="button" className={`report-icon-button ${className}`} aria-label={label} title={label}><i aria-hidden="true" style={{maskImage:`url(/assets/report-actions/${icon}.svg)`}}/></button>});
