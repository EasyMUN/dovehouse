import React, { useCallback, useState, useEffect } from 'react';

import clsx from 'clsx';

import { makeStyles } from '@material-ui/styles';

import { useDispatch } from 'redux-react-hook';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '../overrides/CardContent';
import Avatar from '@material-ui/core/Avatar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import SwipeableViews from 'react-swipeable-views';

import { useRouter } from '../Router';

import { NavLink } from 'react-router-dom';

import { get } from '../store/actions';

import BasicLayout from '../layout/Basic';

const styles = makeStyles(theme => ({
  logo: {
    height: 18,
    width: 18,
    marginRight: theme.spacing.unit,
  },

  abbr: {
    marginBottom: 0,
    color: 'rgba(0,0,0,.38)',
  },

  abbrLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    paddingTop: 20,
    marginTop: 40,
  },

  paymentDesc: {
    textAlign: 'center',
    '$done &': {
      textDecoration: 'line-through',
    },
  },

  paymentTotal: {
    '& small': {
      color: 'rgba(0,0,0,.38)',
      textDecoration: 'none',
    },

    margin: '40px 0',
    textAlign: 'center',
  },

  paidHint: {
    display: 'none',
    textAlign: 'center',
    color: 'rgba(0,0,0,.38)',
    marginBottom: 40,
    marginTop: -35,
  },

  ddlHint: {
    display: 'block',
    textAlign: 'center',
    color: 'rgba(0,0,0,.38)',
    marginBottom: 40,
    marginTop: -35,
  },

  ident: {
    textAlign: 'center',
    color: 'rgba(0,0,0,.38)',
    marginBottom: 40,

    '& strong': {
      color: 'rgba(0,0,0,.87)',
    },
  },

  done: {
    '& $paidHint': {
      display: 'block',
    },

    '& $ddlHint': {
      display: 'none',
    },

    '& $ident': {
      display: 'none',
    },

    '& $qrcodes': {
      display: 'none',
    },
  },

  qrcodes: {},

  qrContainer: {
    padding: 20,
    textAlign: 'center',
  },

  qr: {
    maxWidth: 'calc(100% - 40px)',
  },

  pageTitle: {
    color: 'rgba(0,0,0,.54)',
  },

  aux: {
    position: 'absolute',
    top: 0,
    right: 20,
    display: 'flex',
    justifyContent: 'center',
  },

  auxItem: {
    marginLeft: '10px',
    color: 'rgba(0,0,0,.54)',

    position: 'relative',

    '&:hover $auxContent': {
      opacity: 1,
      transition: 'opacity .2s ease-out',
    }
  },

  content: {
    position: 'relative',
  },

  auxContent: {
    pointerEvents: 'none',
    opacity: 0,
    position: 'absolute',
    right: -10,
    top: -10,

    transition: 'opacity .2s ease-in',

    width: 300,
    background: 'white',
    color: 'rgba(0,0,0,.87)',

    zIndex: 2,
  },

  auxInnerIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  desc: {
    minHeight: 100,
    padding: 20,
  },

  outdated: {
    textDecoration: 'line-through',
  },
}));

function buildDiscountDesc(discount) {
  if(!discount.until) return discount.desc;

  const d = new Date(discount.until);

  return `${discount.desc} - 至 ${d.toLocaleString()}`;
}

function isDiscountOutdated(discount, payment) {
  if(!discount.until) return false;

  const until = new Date(discount.until);
  let d = new Date();
  if(payment.status === 'paid') // Judge based on confirmation date 
    d = new Date(payment.confirmation);

  return until <= d;
}

export function calcTotal(payment) {
  const hasDiscount = payment && payment.discounts && payment.discounts.length > 0;
  if(!hasDiscount) return payment.total;

  return payment.discounts.reduce((acc, d) => {
    if(isDiscountOutdated(d, payment)) return acc;
    return acc - d.amount;
  }, payment.total);
}

export function calcDDL(payment) {
  let minimal = null;
  for(const d of payment.discounts) {
    if(isDiscountOutdated(d, payment)) continue;

    if(minimal === null || new Date(d.until) < new Date(minimal)) minimal = d.until;
  }

  return minimal;
}

export default React.memo(() => {
  const cls = styles();

  const [payment, setPayment] = useState(null);
  const [tab, setTab] = useState(0);

  const { match } = useRouter();
  const dispatch = useDispatch();

  async function fetchPayment() {
    const p = await dispatch(get(`/payment/${match.params.id}`));
    setPayment(p);
  }

  useEffect(() => {
    fetchPayment();
  }, [match]);

  const updateTab = useCallback((ev, t) => setTab(t), [setTab])

  const hasDiscount = payment && payment.discounts && payment.discounts.length > 0;
  const hasDetail = payment && payment.detail;

  let total = 0;
  let ddl = null;
  if(payment) {
    total = calcTotal(payment);
    ddl = calcDDL(payment);
  }

  const inner = payment ? <>
    <Typography variant="h3" className={cls.pageTitle}>订单详情</Typography>

    <Card className={clsx(cls.card, { [cls.done]: payment.status === 'paid' || payment.status === 'closed' })}>
      <CardContent className={cls.content}>
        <Typography variant="h4" className={cls.paymentDesc}>{ payment.desc }</Typography>
        <NavLink className={cls.abbrLine} to={`/conference/${payment.conf._id}`}>
          <Avatar src={payment.conf.logo} className={cls.logo}/>
          <Typography variant="body2" className={cls.abbr}>{ payment.conf.abbr }</Typography>
        </NavLink>

        <div className={cls.aux}>
          { hasDiscount ?
            <div className={cls.auxItem}>
              <Icon>money_off</Icon>

              <Paper className={cls.auxContent}>
                <Icon className={cls.auxInnerIcon}>money_off</Icon>

                <List>
                  { payment.discounts.map((e, index) =>
                    <ListItem key={index}>
                      <ListItemText
                        primary={`-${e.amount} CNY`}
                        secondary={buildDiscountDesc(e)}

                        classes={{
                          primary: isDiscountOutdated(e, payment) ? cls.outdated : undefined,
                        }}
                      />
                    </ListItem>) }
                </List>
              </Paper>
            </div> : null }

          { hasDetail ?
            <div className={cls.auxItem}>
              <Icon>list</Icon>

              <Paper className={cls.auxContent}>
                <Icon className={cls.auxInnerIcon}>list</Icon>

                <div className={cls.desc}>
                  <Typography variant="body1">{ payment.detail }</Typography>
                </div>
              </Paper>
            </div> : null }
        </div>

        <Typography variant="h3" className={cls.paymentTotal}>{ total } <small>CNY</small></Typography>
        <Typography variant="body1" className={cls.paidHint}>{ payment.status === 'paid' ? `已支付，确认于 ${new Date(payment.confirmation).toLocaleString()}` : '已关闭' }</Typography>
        { ddl ? <Typography variant="body1" className={cls.ddlHint}>{ new Date(ddl).toLocaleString() } 前</Typography> : null }

        <Typography variant="body1" className={cls.ident}>支付时请在备注中填入 <strong>{ payment.ident }</strong><br />并确保金额正确，以便我们确认订单</Typography>
      </CardContent>
      <div className={cls.qrcodes}>
        <Tabs
          value={tab}
          onChange={updateTab}
          indicatorColor="secondary"
          textColor="secondary"
          variant="fullWidth"
        >
          { (payment.conf.payments || []).map((p, index) => <Tab key={index} label={p.provider} />) }
        </Tabs>
        <SwipeableViews
          index={tab}
          onChangeIndex={updateTab}
        >
          { (payment.conf.payments || []).map((p, index) => <div key={index} className={cls.qrContainer}>
            <img className={cls.qr} src={p.qr} alt="QR Code" />
          </div>) }
        </SwipeableViews>
      </div>
    </Card>
  </> : null;

  return <BasicLayout>
    { inner }
  </BasicLayout>;
});
