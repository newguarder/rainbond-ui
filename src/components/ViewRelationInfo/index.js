//查看连接信息
import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link, Switch, Route } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Input,
  Dropdown,
  Table,
  Modal,
  notification
} from "antd";
import globalUtil from "../../utils/global";

@connect(({ user, appControl }) => ({
  relationOuterEnvs: appControl.relationOuterEnvs
}))
export default class ViewRelationInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      page: 1,
      page_size: 8,
      total: 0
    };
  }
  componentDidMount() {
    this.getEnvs();
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: "appControl/clearRelationOuterEnvs"
    });
  }

  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.getEnvs();
      }
    );
  };

  getEnvs = () => {
    const { page, page_size } = this.state;
    this.props.dispatch({
      type: "appControl/fetchRelationOuterEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        page,
        page_size
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({ total: res.bean.total });
        }
      }
    });
  };
  render() {
    const { relationOuterEnvs } = this.props;
    const { page, page_size, total } = this.state;

    return (
      <Modal
        title="依赖信息查看"
        width={600}
        visible={true}
        onCancel={this.props.onCancel}
        footer={[<Button onClick={this.props.onCancel}>关闭</Button>]}
      >
        <Table
          pagination={{
            current: page,
            pageSize: page_size,
            total,
            onChange: this.onPageChange
          }}
          columns={[
            {
              title: "变量名",
              dataIndex: "attr_name"
            },
            {
              title: "变量值",
              dataIndex: "attr_value"
            },
            {
              title: "说明",
              dataIndex: "name"
            }
          ]}
          dataSource={relationOuterEnvs || []}
        />
      </Modal>
    );
  }
}
