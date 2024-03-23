import pkg from "pg";
const { Client } = pkg;
import moment from "moment";
const dateFormat = "YYYY-MM-DD HH:mm:ss";

class DBManager {
  async runQuery(sqlQry) {
    var connection = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: { rejectUnauthorized: false },
    });

    connection.connect();

    return new Promise((resolve, reject) => {
      connection.query(sqlQry, function (err, res) {
        connection.end();
        if (err) {
          console.error("SQL Query>", sqlQry);
          console.error("SQL Error>", err.message);
          var error = {
            message: "Critical error! Please try again later",
          };
          reject(error);
          return;
        } else {
          resolve(res);
        }
      });
    });
  }

  async dataInsert(tableName, value, isReturnId = null) {
    value.date_created = moment.utc().format(dateFormat);

    const fields = Object.keys(value)
      .map((key) => `${key}`)
      .join(",");
    const values = Object.values(value)
      .map((value) => {
        return typeof value === "string" ? `E'${value}'` : `${value}`;
      })
      .join(",");

    var sqlQry =
      "INSERT INTO " + tableName + " (" + fields + ") values (" + values + ") ";
    if (isReturnId && isReturnId !== null) {
      sqlQry += ` RETURNING ${isReturnId}`;
    }

    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async dataInsertMany(tableName, values = []) {
    if (values.length == 0) {
      return;
    }
    values = values.map((value) => {
      return {
        ...value,
        date_created: (value.date_created = moment.utc().format(dateFormat)),
      };
    });
    const fields = Object.keys(values[0])
      .map((key) => `${key}`)
      .join(",");
    let sqlQry = "INSERT INTO " + tableName + " (" + fields + ") values ";
    values.forEach((value, index) => {
      const insertValue = Object.values(value)
        .map((value) => {
          return typeof value === "string" ? `E'${value}'` : `${value}`;
        })
        .join(",");

      if (index === values.length - 1) {
        sqlQry += "(" + insertValue + ") ";
      } else {
        sqlQry += "(" + insertValue + "), ";
      }
    });

    sqlQry += ` RETURNING *`;

    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async dataUpdate(
    tableName,
    dataObj,
    whereObj = {},
    isReturnId,
    condition = "AND"
  ) {
    dataObj.date_modified = moment.utc().format(dateFormat);

    const fieldsName = Object.keys(dataObj)
      .map(function (key, index) {
        var value =
          typeof dataObj[key] === "string"
            ? `E'${dataObj[key]}'`
            : `${dataObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(",");

    const wheryQry = Object.keys(whereObj)
      .map(function (key, index) {
        var value =
          typeof whereObj[key] === "string"
            ? `'${whereObj[key]}'`
            : `${whereObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(" " + condition + " ");

    var sqlQry = "UPDATE " + tableName + " SET " + fieldsName;
    if (Object.keys(whereObj).length > 0) {
      sqlQry += " WHERE " + wheryQry;
    }
    if (isReturnId && isReturnId !== null) {
      sqlQry += ` RETURNING ${isReturnId}`;
    }

    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async dataDeleteItems(tableName, whereObj = {}, condition = "AND") {
    const wheryQry = Object.keys(whereObj)
      .map(function (key, index) {
        var value =
          typeof whereObj[key] === "string"
            ? `'${whereObj[key]}'`
            : `${whereObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(" " + condition + " ");

    var sqlQry = "DELETE FROM " + tableName;
    if (Object.keys(whereObj).length > 0) {
      sqlQry += " WHERE " + wheryQry;

      return new Promise((resolve, reject) => {
        this.runQuery(sqlQry)
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      });
    }
  }

  async getData(
    tableName,
    fieldsObj = "*",
    whereObj = {},
    condition = "AND",
    offset = -1,
    limit = -1,
    orderBy = ""
  ) {
    const wheryQry = Object.keys(whereObj)
      .map(function (key, index) {
        var value =
          typeof whereObj[key] === "string"
            ? `'${whereObj[key]}'`
            : `${whereObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(" " + condition + " ");

    var sqlQry = "SELECT " + fieldsObj + " FROM " + tableName;
    if (Object.keys(whereObj).length > 0) {
      sqlQry += " WHERE (" + wheryQry + ")";
      sqlQry += " AND is_deleted = 0";
    } else {
      sqlQry += " WHERE is_deleted = 0";
    }
    if (orderBy != "") {
      sqlQry += orderBy;
    }
    if (offset >= 0 && limit >= 0) {
      sqlQry += `OFFSET ${offset} LIMIT ${limit}`;
    }
    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async getKeyData(
    tableName,
    fieldsObj = "*",
    whereObj = {},
    condition = "AND"
  ) {
    const wheryQry = Object.keys(whereObj)
      .map(function (key, index) {
        var value =
          typeof whereObj[key] === "string"
            ? `'${whereObj[key]}'`
            : `${whereObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(" " + condition + " ");

    var sqlQry = "SELECT " + fieldsObj + " FROM " + tableName;
    if (Object.keys(whereObj).length > 0) {
      sqlQry += " WHERE (" + wheryQry + ")";
      sqlQry += " AND is_deleted = 0";
    } else {
      sqlQry += " WHERE is_deleted = 0";
    }

    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((result) => {
          var dataValue = result?.rows?.[0]?.[fieldsObj] || null;
          resolve(dataValue);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async dataDelete(tableName, whereObj = {}, condition = "AND") {
    const wheryQry = Object.keys(whereObj)
      .map(function (key, index) {
        var value =
          typeof whereObj[key] === "string"
            ? `'${whereObj[key]}'`
            : `${whereObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(" " + condition + " ");

    var sqlQry = "UPDATE " + tableName + " SET is_deleted = 1";
    if (Object.keys(whereObj).length > 0) {
      sqlQry += " WHERE " + wheryQry;
    }
    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async getJoinedData(
    tableName1,
    tableName2,
    table1ColumnName,
    table2ColumnName,
    fieldsObj = "*",
    whereObj = {},
    condition = "AND",
    offset = -1,
    limit = -1,
    customWhere = "",
    orderBy = ""
  ) {
    const wheryQry = Object.keys(whereObj)
      .map(function (key, index) {
        var value =
          typeof whereObj[key] === "string"
            ? `'${whereObj[key]}'`
            : `${whereObj[key]}`;
        return `${key} = ${value}`;
      })
      .join(" " + condition + " ");

    var sqlQry =
      "SELECT " +
      fieldsObj +
      " FROM " +
      tableName1 +
      " JOIN " +
      tableName2 +
      " ON " +
      `${tableName1}.${table1ColumnName}` +
      " = " +
      `${tableName2}.${table2ColumnName}`;
    if (Object.keys(whereObj).length > 0) {
      sqlQry += " WHERE (" + wheryQry + ")";
      sqlQry += ` AND ${tableName1}.is_deleted = 0 AND ${tableName2}.is_deleted = 0`;
    } else {
      sqlQry += ` WHERE ${tableName1}.is_deleted = 0 AND ${tableName2}.is_deleted = 0`;
    }
    if (customWhere != "") {
      sqlQry += " AND " + customWhere;
    }
    if (orderBy != "") {
      sqlQry += orderBy;
    }
    if (offset >= 0 && limit >= 0) {
      sqlQry += ` OFFSET ${offset} LIMIT ${limit}`;
    }

    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async getLimitData(tableName, fieldsObj = "*", offset, limit) {
    var sqlQry =
      "SELECT " +
      fieldsObj +
      " FROM " +
      tableName +
      " LIMIT " +
      limit +
      " OFFSET " +
      offset;
    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async countRecord(tableName, whereObj = {}) {
    const whereQry = Object.keys(whereObj).map(function (key, index) {
      return `${key}='${whereObj[key]}'`;
    });

    var sqlQry = `SELECT COUNT(*) as total FROM ${tableName} WHERE ${whereQry} AND is_deleted = 0`;

    // if (whereQry !== "") {
    //   sqlQry += ` AND ${whereQry}`;
    // }

    return new Promise((resolve, reject) => {
      this.runQuery(sqlQry)
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
export { DBManager };
