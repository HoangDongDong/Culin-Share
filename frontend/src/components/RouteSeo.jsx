import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {applySeo, routeSeo} from '../services/seo.mjs';

export default function RouteSeo(){
  const {pathname,search}=useLocation();
  useLayoutEffect(()=>{applySeo(routeSeo(pathname,search));},[pathname,search]);
  return null;
}
